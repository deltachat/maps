
// set up map

var map = L.map('map', {
        doubleClickZoom: true,
        zoomControl: false, // added manually below
        tapHold: true
    });
if (localStorage.getItem('map.lat') === null) {
    map.setView([30, -30], 3);
} else {
    map.setView([localStorage.getItem('map.lat'), localStorage.getItem('map.lng')], localStorage.getItem('map.zoom'));
}
map.attributionControl.setPrefix('');
L.control.scale({position: 'bottomleft'}).addTo(map);
L.control.zoom({position: 'topright'}).addTo(map);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap"
    }).addTo(map);

var pinIcon = L.icon({
    iconUrl: 'images/pin-icon.png',
    iconRetinaUrl: 'images/pin-icon-2x.png',
    iconSize:     [12, 29], // size of the icon
    iconAnchor:   [6, 29], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -29] // point from which the popup should open relative to the iconAnchor
});

var tracks = {};
var initDone = false;



// set up webxdc

window.webxdc.setUpdateListener((update) => {
    const payload = update.payload;
    if (payload.action === 'pos') {
        if (payload.independent) {
            var marker = L.marker([payload.lat, payload.lng], {
                    icon: pinIcon
                }).addTo(map);
            marker.bindTooltip(htmlentities(shortLabel(payload)), {
                    permanent: true,
                    direction: 'bottom',
                    offset: [0, -15],
                    className: 'transparent-tooltip'
                }).openTooltip();
            marker.bindPopup(popupHtml(payload), { closeButton: false });
        } else {
            if (!tracks[payload.contactId]) {
                tracks[payload.contactId] = {
                    lines: [[]],
                    payload: payload,
                    lastTimestamp: payload.timestamp,
                    marker: null,
                    polyline: null
                };
            } else {
                tracks[payload.contactId].payload = payload;
            }

            var lastLine = tracks[payload.contactId].lines.length - 1;
            if ((payload.timestamp - tracks[payload.contactId].lastTimestamp) > 5 * 60) {
                // larger time difference: start new line and connect with previous point on track
                if (tracks[payload.contactId].lines[lastLine].length == 1) {
                    tracks[payload.contactId].lines[lastLine].push(tracks[payload.contactId].lines[lastLine][0]);
                }
                tracks[payload.contactId].lines.push([]);
                lastLine++;
            }

            tracks[payload.contactId].lines[lastLine].push([payload.lat, payload.lng]);
            tracks[payload.contactId].lastTimestamp = payload.timestamp;
            if (initDone) {
                updateTrack(payload.contactId);
            }
        }
    }
}).then(() => {
    updateTracks();
    initDone = true;
});



// contact's tracks

function updateTrack(contactId) {
    var track = tracks[contactId];

    if (track.polyline) {
        map.removeLayer(track.polyline);
    }
    track.polyline = L.polyline(track.lines, {color: track.payload.color, weight: 4}).addTo(map);

    var lastLine = track.lines.length - 1;
    var lastLatLng = track.lines[lastLine][ track.lines[lastLine].length-1 ];
    if (track.marker == null) {
        track.marker = L.circleMarker(lastLatLng, {
                color: track.payload.color,
                weight: 3,
                radius: 11,
                fill: true, // fill=true is needed for a reasonable clicking area
                fillOpacity: 0.0
            }).addTo(map);
        var tooltip = L.tooltip({
                content: '<span style="color:'+track.payload.color+'">' + htmlentities(shortLabel(track.payload)) + '</span>',
                permanent: true,
                direction: 'bottom',
                offset: [0, -24],
                className: 'transparent-tooltip'
          });
        track.marker.bindTooltip(tooltip).openTooltip();
    } else {
        track.marker.setLatLng(lastLatLng);
    }
    track.marker.unbindPopup();
    track.marker.bindPopup(popupHtml(track.payload), { closeButton: false });
}

function updateTracks() {
    for (contactId in tracks) {
        updateTrack(contactId);
    }
}



// share a dedicated location

var popup;
var popupLatlng;

function onSend() {
    const elem = document.getElementById('textToSend');
    const value =  elem.value.trim();
    if (value != "") {
        popup.close();
        webxdc.sendUpdate({
                payload: {
                    action: 'pos',
                    lat: popupLatlng.lat,
                    lng: popupLatlng.lng,
                    text: elem.value,
                },
            }, 'POI added to map at ' + popupLatlng.lat.toFixed(4) + '/' + popupLatlng.lng.toFixed(4) + ' with text: ' + value);
    } else {
        elem.placeholder = "Enter label" // just some cheap visual feedback
    }
}

function onMapLongClick(e) {
    popupLatlng = e.latlng;
    popup = L.popup({closeButton: false, keepInView: true})
        .setLatLng(popupLatlng)
        .setContent('<div class="formx"><img src="images/pin-icon.png"><br><input type=text size=9 id=textToSend placeholder="Label"><br><button onclick="onSend()">Send</button></div>')
        .openOn(map);
}

map.on('contextmenu', onMapLongClick);



// handle position and zoom

function onMapMoveOrZoom(e) {
    localStorage.setItem('map.lat', map.getCenter().lat);
    localStorage.setItem('map.lng', map.getCenter().lng);
    localStorage.setItem('map.zoom', map.getZoom());
}

map.on('moveend', onMapMoveOrZoom);
map.on('zoomend', onMapMoveOrZoom);



// tools

function htmlentities(rawStr) {
    return rawStr.replace(/[\u00A0-\u9999<>\&]/g, ((i) => `&#${i.charCodeAt(0)};`));
}

function shortLabel(payload) {
    var label = payload.text;
    if (label.length > 9) {
        label = label.substring(0, 8).trim() + "..";
    }
    return label;
}

function popupHtml(payload) {
    return '<div>' + htmlentities(payload.text) + '</div>'
        + '<div><small>'
        + payload.lat.toFixed(4) + '°/' + payload.lng.toFixed(4) + '°<br>'
        + htmlentities(new Date(payload.timestamp*1000).toLocaleString())
        + '</small></div>';
}
