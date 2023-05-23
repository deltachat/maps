


var map = L.map('map', {doubleClickZoom: true, zoomControl: false, /* added manually below */ tapHold: true, })
    .setView([53.785054, 9.408707], 15);
map.attributionControl.setPrefix('');
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map);
L.control.scale({position: 'bottomleft'}).addTo(map);
L.control.zoom({position: 'topright'}).addTo(map);
var tracks = {};
var contacts = {};


window.webxdc.setUpdateListener((update) => {
    const payload = update.payload;
    if (payload.action === 'pos') {
        if (payload.independent) {
            var label = payload.text == '' ? '??' : payload.text;
            if (label.length > 10) {
                label = label.substring(0, 9).trim() + ".."
            }
            labelHtml = htmlentities(label);

            var marker = L.marker(payload).addTo(map);
            marker.bindTooltip(labelHtml, {permanent: true, direction: 'bottom', offset: [-15, 15], className: 'transparent-tooltip'}).openTooltip();
            marker.bindPopup(popupHtml(payload), {closeButton: false});
        } else {
            if (!Array.isArray(tracks[payload.contactId])) {
                tracks[payload.contactId] = [];
                contacts[payload.contactId] = payload;
            }
            tracks[payload.contactId].push([payload.lat,payload.lng]);
        }
    }
}).then(() => {
    updateTracks();
});

function popupHtml(payload) {
    return '<div>' + htmlentities(payload.text) + '</div>'
        + '<div><small>'
        + payload.lat.toFixed(4) + '°/' + payload.lng.toFixed(4) + '°<br>'
        + htmlentities(new Date(payload.timestamp*1000).toLocaleString())
        + '</small></div>';
}

// contact's tracks

function updateTracks() {
    for (contactId in tracks) {
        L.polyline(tracks[contactId], {color: contacts[contactId].color, weight: 5}).addTo(map);
        var marker = L.marker({lat: tracks[contactId][0][0], lng: tracks[contactId][0][1]}).addTo(map);
        marker.bindTooltip(contacts[contactId].text, {permanent: true, direction: 'bottom', offset: [-15, 15], className: 'transparent-tooltip'}).openTooltip();
        marker.bindPopup(popupHtml(contacts[contactId]), {closeButton: false});
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
            },
            'POI added to map at ' + popupLatlng.lat.toFixed(4) + '/' + popupLatlng.lng.toFixed(4) + ' with text: ' + value
        );
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


// tools

function htmlentities(rawStr) {
    return rawStr.replace(/[\u00A0-\u9999<>\&]/g, ((i) => `&#${i.charCodeAt(0)};`));
}