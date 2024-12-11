// set up map
var map = L.map('map', {
        doubleClickZoom: true, 
        zoomControl: false,
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

var select = document.createElement('select');
select.id = 'mapTileServiceSelector';

for (var serviceKey in mapServices) {
    var option = document.createElement('option');
    option.value = serviceKey;
    option.textContent = serviceKey; 
    select.appendChild(option);
}

document.body.appendChild(select);

var tileLayer = null;
var annotationLayer = null;

function addMapService(map, serviceKey) {
    const service = mapServices[serviceKey];
    if (!service) return;

    if (tileLayer && map.hasLayer(tileLayer)) {
        map.removeLayer(tileLayer);
    }
    if (annotationLayer && map.hasLayer(annotationLayer)) {
    map.removeLayer(annotationLayer);
   }
    const subdomains = service.subdomains || [];

    tileLayer = L.tileLayer(service.url, {
        maxZoom: service.options.maxZoom,
        attribution: service.options.attribution,
        tms: service.options.tms || false,
        subdomains: subdomains//service.subdomains.join(',')
    }).addTo(map);
    
    if(service.annotationLayer) {
        const annotationLayersubdomains = service.annotationLayer.subdomains || [];
        annotationLayer = L.tileLayer(service.annotationLayer.url, {
        maxZoom: service.annotationLayer.options.maxZoom,
	 tms: service.annotationLayer.options.tms || false,
        subdomains: annotationLayersubdomains//service.subdomains.join(',')
    }).addTo(map);
    }
}

//addMapService(map, defaultServiceKey);
select.value = defaultServiceKey; 
select.addEventListener('change', function() {
    const selectedService = this.value;
    addMapService(map, selectedService);
});
select.dispatchEvent(new Event('change'));

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
            if (payload.label) {
                marker.bindTooltip(shortLabelHtml(payload.label), {
                        permanent: true,
                        interactive: true,
                        direction: 'bottom',
                        offset: [0, -17],
                        className: 'poi-tooltip'
                    }).openTooltip();
            }
            marker.on('click', function () {
                if (!marker.getPopup()) {
                    marker.bindPopup(popupHtml(payload), { closeButton: false }).openPopup();
                }
            });
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

    var content = '<span class="ppl-name" style="background-color:'+track.payload.color+';">' + shortLabelHtml(track.payload.name) + '</span>';
    const age = Math.floor(Date.now() / 1000) - track.payload.timestamp;
    if (age > 60*60) {
        content += '<br><span class="ppl-time">' + Math.floor(age/60/60) + 'h ago</span>';
    } else if (age > 30*60) {
        content += '<br><span class="ppl-time">½h ago</span>';
    } else if (age > 15*60) {
        content += '<br><span class="ppl-time">¼h ago</span>';
    } else {
        content += '<br><span class="ppl-online"></span>';
    }

    const lastLine = track.lines.length - 1;
    const lastLatLng = track.lines[lastLine][ track.lines[lastLine].length-1 ];
    if (track.marker) {
        map.removeLayer(track.marker);
    }
    track.marker = L.marker(lastLatLng, {
            icon: pinIcon,
            opacity: 0
        }).addTo(map);
    var tooltip = L.tooltip({
            content: content,
            permanent: true,
            interactive: true,
            direction: 'bottom',
            offset: [0, -28],
            className: 'ppl-tooltip'
        });
    track.marker.bindTooltip(tooltip).openTooltip();
    track.marker.unbindPopup();
    track.marker.on('click', function () {
        if (!track.marker.getPopup()) {
            track.marker.bindPopup(popupHtml(track.payload), { closeButton: false }).openPopup();
        }
    });
}

function updateTracks() {
    for (contactId in tracks) {
        updateTrack(contactId);
    }
}

setInterval(() => {
    updateTracks(); // update is needed for the relative time shown
}, 60*1000);


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
                    independent: true,
                    timestamp: Math.floor(Date.now() / 1000),
                    lat: popupLatlng.lat,
                    lng: popupLatlng.lng,
                    label: elem.value,
                    name: webxdc.selfName,
                    color: '#888'
                },
            }, 'POI added to map at ' + popupLatlng.lat.toFixed(4) + '/' + popupLatlng.lng.toFixed(4) + ' with text: ' + value);
    } else {
        elem.placeholder = elem.placeholder == 'Label' ? "Enter label" : "Label"; // just some cheap visual feedback
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

function shortLabelHtml(label) {
    if (label.length > 9) {
        label = htmlentities(label.substring(0, 8).trim()) + "..";
    } else if (label.length <= 4) {
        const padding = '&nbsp;'.repeat((7-label.length)/2);
        label = padding + htmlentities(label) + padding;
    }
    return label;
}

function popupHtml(payload) {
    return '<div><small><b style="color:'+payload.color+'">' + htmlentities(payload.name) + '</b></small></div>'
        + '<div>' + htmlentities(payload.label) + '</div>'
        + '<div><small>'
        + payload.lat.toFixed(4) + '°/' + payload.lng.toFixed(4) + '°<br>'
        + htmlentities(new Date(payload.timestamp*1000).toLocaleString())
        + '</small></div>';
}
