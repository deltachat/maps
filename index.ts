// Reference type definitions
/// <reference types="leaflet" />
/// <reference path="node_modules/webxdc-types/global.d.ts" />


// set up map
const map: L.Map = L.map('map', {
    doubleClickZoom: true,
    zoomControl: false, // added manually below
    tapHold: true
});

if (localStorage.getItem('map.lat') === null) {
    map.setView([30, -30], 3);
} else {
    const lat = localStorage.getItem('map.lat');
    const lng = localStorage.getItem('map.lng');
    const zoom = localStorage.getItem('map.zoom');
    if (lat && lng && zoom) {
        map.setView([parseFloat(lat), parseFloat(lng)], parseInt(zoom));
    }
}

map.attributionControl.setPrefix('');
L.control.scale({position: 'bottomleft'}).addTo(map);
L.control.zoom({position: 'topright'}).addTo(map);

// Overlay management
let contactOverlayVisible = false;
let poiOverlayVisible = false;
const contactsData = new Map<number, ContactData>(); // Store contact data for the overlay
const poiData = new Map<string, PoiData>(); // Store POI data for the overlay

// DOM elements
const contactOverlay = document.getElementById('contactsOverlay') as HTMLElement;
const poiOverlay = document.getElementById('poiOverlay') as HTMLElement;
const toggleBtn = document.getElementById('toggleOverlay') as HTMLButtonElement;
const poiToggleBtn = document.getElementById('togglePoiOverlay') as HTMLButtonElement;

function initOverlay(): void {
    contactOverlay.style.display = 'none';
    poiOverlay.style.display = 'none';
    toggleBtn.textContent = '👤';
    poiToggleBtn.style.display = 'none'; // Hidden by default
    console.log(tracks);

    toggleBtn.addEventListener('click', function() {
        contactOverlayVisible = !contactOverlayVisible;
        if (contactOverlayVisible) {
            poiOverlayVisible = false;
        }
        showHideOverlays();
    });

    poiToggleBtn.addEventListener('click', function() {
        poiOverlayVisible = !poiOverlayVisible;
        if (poiOverlayVisible) {
            contactOverlayVisible = false;
        }
        showHideOverlays();
    });

    function showHideOverlays(): void {
        contactOverlay.style.display = contactOverlayVisible ? 'block' : 'none';
        poiOverlay.style.display = poiOverlayVisible ? 'block' : 'none';
    }
}

// Update the contacts overlay
function updateContactsOverlay(): void {
    const contactsList = document.getElementById('contactsList') as HTMLElement;

    if (contactsData.size === 0) {
        contactsList.innerHTML = '<div class="no-items">No contacts shared their location yet</div>';
        return;
    }

    if (contactsData.size > 1) {
        toggleBtn.textContent = '👥';
    }

    let html = '';
    contactsData.forEach((contact, contactId) => {
        const timeAgo = formatTimeAgo(contact.lastTimestamp);
        html += `
            <div class="contact-item">
                <div class="contact-color" style="background-color: ${contact.color}"></div>
                <div class="contact-name">${htmlentities(contact.name)}</div>
                <div class="contact-time">${timeAgo}</div>
                <button class="item-button" onclick="zoomToContact(${contactId})">📍</button>
            </div>
        `;
    });

    contactsList.innerHTML = html;
}

// Update the POI overlay
function updatePoiOverlay(): void {
    const poiList = document.getElementById('poiList') as HTMLElement;

    if (poiData.size === 0) {
        poiList.innerHTML = '<div class="no-contacts">No POIs yet</div>';
        poiToggleBtn.style.display = 'none';
        return;
    }

    // Show POI toggle button if there are POIs
    poiToggleBtn.style.display = 'block';

    let html = '';
    poiData.forEach((poi, poiId) => {
        const timeAgo = formatTimeAgo(poi.timestamp);
        html += `
            <div class="contact-item poi-item">
                <div class="contact-color" style="background-color: ${poi.color}"></div>
                <div class="contact-name">${htmlentities(poi.label || poi.name)}</div>
                <div class="contact-time">${timeAgo}</div>
                <button class="item-button" onclick="zoomToPoi('${poiId}')">📍</button>
            </div>
        `;
    });

    poiList.innerHTML = html;
}

// Format timestamp to relative time (e.g., "2h ago", "30m ago", "3d ago")
function formatTimeAgo(timestamp: number): string {
    if (!timestamp) return '';

    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) {
        return 'now';
    } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        return minutes + 'm ago';
    } else if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        return hours + 'h ago';
    } else {
        const days = Math.floor(diff / 86400);
        return days + 'd ago';
    }
}

// Function to zoom to a specific contact's last position
function zoomToContact(contactId: number): void {
    const contact = contactsData.get(contactId);
    if (contact && contact.lastPosition) {
        zoomToPosition(contact.lastPosition);
    } else {
        console.log('Contact not found or no position');
    }
}

// Function to zoom to a specific POI
function zoomToPoi(poiId: string): void {
    console.log('poiData contents:', poiData);
    const poi = poiData.get(poiId);
    console.log('Found poi:', poi);
    if (poi && poi.position) {
        zoomToPosition(poi.position);
    } else {
        console.log('POI not found or no position');
    }
}

function zoomToPosition(position: [number, number]): void {
    map.setView(position, 15, {animate: true, duration: 1.2});
}

// Initialize overlay when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initOverlay();
    updateContactsOverlay();
    updatePoiOverlay();
});

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
}).addTo(map);

const pinIcon = L.icon({
    iconUrl: 'images/pin-icon.png',
    iconRetinaUrl: 'images/pin-icon-2x.png',
    iconSize: [12, 29], // size of the icon
    iconAnchor: [6, 29], // point of the icon which will correspond to marker's location
    popupAnchor: [0, -29] // point from which the popup should open relative to the iconAnchor
});

const tracks: Tracks = {};
let initDone = false;

window.webxdc.setUpdateListener((update: { payload: Payload }) => {
    const payload = update.payload;
    if (payload.action === 'pos') {
        if (payload.independent) {
            // Store POI data for overlay
            const poiId = 'poi_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const poiDataObj: PoiData = {
                name: payload.name,
                label: payload.label,
                color: payload.color,
                position: [payload.lat, payload.lng],
                timestamp: payload.timestamp
            };
            console.log('Adding POI with ID:', poiId, 'Data:', poiDataObj);
            poiData.set(poiId, poiDataObj);

            // Update POI overlay
            updatePoiOverlay();

            const marker = L.marker([payload.lat, payload.lng], {
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
            // Update contacts data for overlay
            if (!contactsData.has(payload.contactId)) {
                contactsData.set(payload.contactId, {
                    name: payload.name,
                    color: payload.color,
                    lastPosition: [payload.lat, payload.lng],
                    lastTimestamp: payload.timestamp
                });
            } else {
                const contact = contactsData.get(payload.contactId);
                if (contact) {
                    contact.name = payload.name;
                    contact.color = payload.color;
                    contact.lastPosition = [payload.lat, payload.lng];
                    contact.lastTimestamp = payload.timestamp;
                }
            }

            // Update overlay
            updateContactsOverlay();

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

            const lastLine = tracks[payload.contactId].lines.length - 1;
            if ((payload.timestamp - tracks[payload.contactId].lastTimestamp) > 5 * 60) {
                // larger time difference: start new line and connect with previous point on track
                if (tracks[payload.contactId].lines[lastLine].length == 1) {
                    tracks[payload.contactId].lines[lastLine].push(tracks[payload.contactId].lines[lastLine][0]);
                }
                tracks[payload.contactId].lines.push([]);
                const newLastLine = lastLine + 1;
                if (initDone) {
                    updateTrack(payload.contactId);
                }
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
function updateTrack(contactId: number): void {
    const track = tracks[contactId];

    if (track.polyline) {
        map.removeLayer(track.polyline);
    }
    track.polyline = L.polyline(track.lines, {color: track.payload.color, weight: 4}).addTo(map);

    let content = '<span class="ppl-name" style="background-color:'+track.payload.color+';">' + shortLabelHtml(track.payload.name) + '</span>';
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

    // Update contacts data with latest position
    if (contactsData.has(contactId)) {
        const contact = contactsData.get(contactId);
        if (contact) {
            contact.lastPosition = lastLatLng;
            contact.lastTimestamp = track.lastTimestamp;
        }
    }

    if (track.marker) {
        map.removeLayer(track.marker);
    }
    track.marker = L.marker(lastLatLng, {
        icon: pinIcon,
        opacity: 0
    }).addTo(map);

    const tooltip = L.tooltip({
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

function updateTracks(): void {
    for (const contactId in tracks) {
        updateTrack(parseInt(contactId));
    }
    // Update overlays after updating all tracks
    updateContactsOverlay();
    updatePoiOverlay();
}

setInterval(() => {
    updateTracks(); // update is needed for the relative time shown
}, 60*1000);

// share a dedicated location
let popup: L.Popup | null = null;
let popupLatlng: L.LatLng | null = null;

function onSend(): void {
    const elem = document.getElementById('textToSend') as HTMLInputElement;
    const value = elem.value.trim();
    if (value != "" && popup && popupLatlng) {
        popup.close();
        window.webxdc.sendUpdate({
            payload: {
                action: 'pos',
                independent: true,
                timestamp: Math.floor(Date.now() / 1000),
                lat: popupLatlng.lat,
                lng: popupLatlng.lng,
                label: elem.value,
                name: window.webxdc.selfName,
                color: '#888',
                contactId: 0 // Required by interface but not used for POIs
            },
        }, 'POI added to map at ' + popupLatlng.lat.toFixed(4) + '/' + popupLatlng.lng.toFixed(4) + ' with text: ' + value);
    } else {
        if (elem.placeholder === 'Label') {
            elem.placeholder = "Enter label";
        } else {
            elem.placeholder = "Label";
        } // just some cheap visual feedback
    }
}

function onMapLongClick(e: L.LeafletMouseEvent): void {
    popupLatlng = e.latlng;
    popup = L.popup({closeButton: false, keepInView: true})
        .setLatLng(popupLatlng)
        .setContent('<div class="formx"><img src="images/pin-icon.png"><br><input type=text size=9 id="textToSend" placeholder="Label"><br><button onclick="onSend()">Send</button></div>')
        .openOn(map);
}

map.on('contextmenu', onMapLongClick);

// handle position and zoom
function onMapMoveOrZoom(e: L.LeafletEvent): void {
    localStorage.setItem('map.lat', map.getCenter().lat.toString());
    localStorage.setItem('map.lng', map.getCenter().lng.toString());
    localStorage.setItem('map.zoom', map.getZoom().toString());
}

map.on('moveend', onMapMoveOrZoom);
map.on('zoomend', onMapMoveOrZoom);

// tools
function htmlentities(rawStr: string): string {
    return rawStr.replace(/[\u00A0-\u9999<>\&]/g, ((i) => `&#${i.charCodeAt(0)};`));
}

function shortLabelHtml(label: string): string {
    if (label.length > 9) {
        label = htmlentities(label.substring(0, 8).trim()) + "..";
    } else if (label.length <= 4) {
        const padding = '&nbsp;'.repeat((7-label.length)/2);
        label = padding + htmlentities(label) + padding;
    }
    return label;
}

function popupHtml(payload: Payload): string {
    return '<div><small><b style="color:'+payload.color+'">' + htmlentities(payload.name) + '</b></small></div>'
        + '<div>' + htmlentities(payload.label || '') + '</div>'
        + '<div><small>'
        + payload.lat.toFixed(4) + '°/' + payload.lng.toFixed(4) + '°<br>'
        + htmlentities(new Date(payload.timestamp*1000).toLocaleString())
        + '</small></div>';
}

// Make functions globally available for onclick handlers
(window as any).zoomToContact = zoomToContact;
(window as any).zoomToPoi = zoomToPoi;
(window as any).onSend = onSend;
