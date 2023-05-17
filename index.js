
var map = L.map('map', {
        doubleClickZoom: true,
        tapHold: true,
    })
    .setView([47.997791, 7.842609], 13);
map.attributionControl.setPrefix('');
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

window.webxdc.setUpdateListener(function(update) {
    const payload = update.payload;
    if (payload.action === 'independent-pos') {
        var marker = L.marker(payload).addTo(map);
        marker.bindTooltip(htmlentities(payload.text), {permanent: true, direction: 'bottom', offset: [-15, 15], className: 'transparent-tooltip'}).openTooltip();
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