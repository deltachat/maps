
var map = L.map('map', {
        doubleClickZoom: true,
        zoomControl: false, /* added manually below */
        tapHold: true,
    })
    .setView([47.997791, 7.842609], 13);
map.attributionControl.setPrefix('');
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);
L.control.scale({position: 'bottomleft', imperial: false}).addTo(map);
L.control.zoom({position: 'bottomright'}).addTo(map);

window.webxdc.setUpdateListener(function(update) {
    const payload = update.payload;
    if (payload.action === 'independent-pos') {
        var label = payload.text;
        if (label.length > 10) {
            label = label.substring(0, 9).trim() + ".."
        }

        var marker = L.marker(payload).addTo(map);
        marker.bindTooltip(htmlentities(label), {permanent: true, direction: 'bottom', offset: [-15, 15], className: 'transparent-tooltip'}).openTooltip();
        marker.bindPopup(htmlentities(payload.text));
    }
});


// share a dedicated location

var popup;
var popupLatlng;

function onSend() {
    const elem = document.getElementById('textToSend');
    popup.close();
    webxdc.sendUpdate({
            payload: {
                action: 'independent-pos',
                lat: popupLatlng.lat,
                lng: popupLatlng.lng,
                text: elem.value,
            },
        },
        'POI added to map at ' + popupLatlng.lat.toFixed(4) + '/' + popupLatlng.lng.toFixed(4) + ' with text: ' + elem.value
    );
}

function onMapLongClick(e) {
    popupLatlng = e.latlng;
    popup = L.popup()
        .setLatLng(popupLatlng)
        .setContent('<input type=text id=textToSend placeholder="POI description"> <button onclick="onSend()">Send</button>')
        .openOn(map);
    console.log('map clicked at ' + popupLatlng);
}

map.on('contextmenu', onMapLongClick);


// tools

function htmlentities(rawStr) {
    return rawStr.replace(/[\u00A0-\u9999<>\&]/g, ((i) => `&#${i.charCodeAt(0)};`));
}