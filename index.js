
var map = L.map('map', {
        doubleClickZoom: true,
        zoomControl: false, /* added manually below */
        tapHold: true
    });
if (localStorage.getItem('map.latxxx') === null) {
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

var tracks = {};   // hash contactId to positions, last position == newest position
var contacts = {}; // hash contactId to info



window.webxdc.setUpdateListener((update) => {
    const payload = update.payload;
    if (payload.action === 'pos') {
        if (payload.independent) {
            var label = payload.text == '' ? '??' : payload.text;
            if (label.length > 10) {
                label = label.substring(0, 9).trim() + ".."
            }

            var marker = L.marker([payload.lat, payload.lng], {
                    icon: pinIcon
                }).addTo(map);
            marker.bindTooltip(htmlentities(label), {
                    permanent: true,
                    direction: 'bottom',
                    offset: [0, -15],
                    className: 'transparent-tooltip'
                }).openTooltip();
            marker.bindPopup(popupHtml(payload), { closeButton: false });
        } else {
            if (!Array.isArray(tracks[payload.contactId])) {
                tracks[payload.contactId] = [];
                contacts[payload.contactId] = payload;
            }
            tracks[payload.contactId].push([payload.lat, payload.lng]);
        }
    }
}).then(() => {
    updateTracks();
});



// contact's tracks

function updateTracks() {
    for (contactId in tracks) {
        L.polyline(tracks[contactId], {color: contacts[contactId].color, weight: 4}).addTo(map);

        var lastMarker = tracks[contactId].length - 1;
        var marker = L.circleMarker([tracks[contactId][lastMarker][0], tracks[contactId][lastMarker][1]], {
                color: contacts[contactId].color,
                weight: 3,
                fill: true, // fill=true is needed for a reasonable clicking area
                fillOpacity: 0.0
            }).addTo(map);
        var tooltip = L.tooltip([tracks[contactId][lastMarker][0], tracks[contactId][lastMarker][1]], {
                content: '<span style="color:'+contacts[contactId].color+'">' + htmlentities(contacts[contactId].text) + '</span>',
                permanent: true,
                direction: 'bottom',
                offset: [0, -24],
                className: 'transparent-tooltip'
          });
        marker.bindTooltip(tooltip).openTooltip();
        marker.bindPopup(popupHtml(contacts[contactId]), { closeButton: false });
    }
}



// share a dedicated location

var popup;
var popupLatlng;

function onSend() {
    const elem = document.getElementById('textToSend');
    popup.close();
    const value =  elem.value.trim();
    if (value != "") {
        webxdc.sendUpdate({
                payload: {
                    action: 'pos',
                    lat: popupLatlng.lat,
                    lng: popupLatlng.lng,
                    text: elem.value,
                },
            }, 'POI added to map at ' + popupLatlng.lat.toFixed(4) + '/' + popupLatlng.lng.toFixed(4) + ' with text: ' + value);
    }
}

function onMapLongClick(e) {
    popupLatlng = e.latlng;
    popup = L.popup({closeButton: false})
        .setLatLng(popupLatlng)
        .setContent('<small>&nbsp;Send POI</small><div class="formx"><input type=text size=12 id=textToSend placeholder="Emoji or label"> <button onclick="onSend()">Send</button></div>')
        .openOn(map);
    console.log('map clicked at ' + popupLatlng);
}

map.on('contextmenu', onMapLongClick);


// save position and zoom

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

function popupHtml(payload) {
    return '<div>' + htmlentities(payload.text) + '</div>'
        + '<div><small>'
        + payload.lat.toFixed(4) + '°/' + payload.lng.toFixed(4) + '°<br>'
        + htmlentities(new Date(payload.timestamp*1000).toLocaleString())
        + '</small></div>';
}
