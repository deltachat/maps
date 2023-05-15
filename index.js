
var map = L.map('map').setView([47.997791, 7.842609], 13);
map.attributionControl.setPrefix('');
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

window.webxdc.setUpdateListener(function(update) {
    const payload = update.payload;
    if (payload.action === 'independent-pos') {
        L.marker(payload.latlng).addTo(map);
    }
});



// Share a dedicated location

var popup;
var popupLatlng;

function onSend() {
    const elem = document.getElementById('textToSend');
    popup.close();
    webxdc.sendUpdate({
            payload: {
                action: 'independent-pos',
                latlng: popupLatlng,
                text: elem.value,
            },
        },
        'POI added to map at ' + popupLatlng['lat'] + '/' + popupLatlng['lng'] + ' with text: ' + elem.value
    );
}

function onMapLongClick(e) {
    popupLatlng = e.latlng;
    popup = L.popup()
        .setLatLng(popupLatlng)
        .setContent('<input type=text id=textToSend placeholder="Send point of interest"> <button onclick="onSend()">Send</button>')
        .openOn(map);
    console.log('map clicked at ' + popupLatlng);
}

map.on('click', onMapLongClick);
