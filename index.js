


var map = L.map('map', {doubleClickZoom: true, zoomControl: false, /* added manually below */ tapHold: true, })
    .setView([47.997791, 7.842609], 13);
map.attributionControl.setPrefix('');
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map);
L.control.scale({position: 'bottomleft'}).addTo(map);
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
        marker.bindPopup(htmlentities(payload.text), {closeButton: false});
    }
});


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
                    action: 'independent-pos',
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