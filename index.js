const map = new L.Map('map', {
    doubleClickZoom: true,
    zoomControl: false, // added manually below 123
    tapHold: true,
});
if (localStorage.getItem('map.lat') === null) {
    map.setView([30, -30], 3);
} else {
    map.setView(
        [localStorage.getItem('map.lat'), localStorage.getItem('map.lng')],
        localStorage.getItem('map.zoom')
    );
}
map.attributionControl.setPrefix('');
new L.Control.Scale({ position: 'bottomleft' }).addTo(map);
new L.Control.Zoom({ position: 'topright' }).addTo(map);

if (/wv/.test(navigator.userAgent) && /Android/.test(navigator.userAgent)) {
    document.body.classList.add('android-webview');
}

const select = document.getElementById('mapTileServiceSelector');

for (const serviceKey in mapServices) {
    const option = document.createElement('option');
    option.value = serviceKey;
    option.textContent = serviceKey;
    select.appendChild(option);
}

let tileLayer = null;
let annotationLayer = null;

function addMapService(map, serviceKey) {
    localStorage.setItem('map.tileService', serviceKey);
    console.log('Switching tile service to:', serviceKey);
    const service = mapServices[serviceKey];
    if (!service) return;

    if (tileLayer && map.hasLayer(tileLayer)) {
        map.removeLayer(tileLayer);
    }
    if (annotationLayer && map.hasLayer(annotationLayer)) {
        map.removeLayer(annotationLayer);
    }
    const subdomains = service.subdomains || [];
    // desktop does not allow electron to access internet directly
    tileLayer = new L.TileLayer(service.url, {
        maxZoom: service.options.maxZoom,
        attribution: service.options.attribution,
        tms: service.options.tms || false,
        subdomains: subdomains, //service.subdomains.join(',')
    }).addTo(map);

    if (service.annotationLayer) {
        const annotationLayersubdomains =
            service.annotationLayer.subdomains || [];
        annotationLayer = new L.TileLayer(
            service.annotationLayer.url,
            {
                maxZoom: service.annotationLayer.options.maxZoom,
                tms: service.annotationLayer.options.tms || false,
                subdomains: annotationLayersubdomains, //service.subdomains.join(',')
            }
        ).addTo(map);
    }
}

select.addEventListener('change', function () {
    const selectedService = this.value;
    console.log('Selected tile service:', selectedService);
    addMapService(map, selectedService);
});

let tileServiceKey = defaultServiceKey;
if (localStorage.getItem('map.tileService') !== null) {
    tileServiceKey = localStorage.getItem('map.tileService');
    console.log('Restoring tile service:', tileServiceKey);
} else {
    console.log('Using default tile service:', defaultServiceKey);
}

select.value = tileServiceKey;
select.dispatchEvent(new Event('change'));

const pinIcon = new L.Icon({
    iconUrl: 'images/pin-icon.png',
    iconRetinaUrl: 'images/pin-icon-2x.png',
    iconSize: [12, 29], // size of the icon
    iconAnchor: [6, 29], // point of the icon which will correspond to marker's location
    popupAnchor: [0, -29], // point from which the popup should open relative to the iconAnchor
});

// Overlay management
let contactOverlayVisible = false;
let poiOverlayVisible = false;
let settingsOverlayVisible = false;
const contactsData = new Map(); // Store contact data for the overlay
const poiData = new Map(); // Store POI data for the overlay
const deletedPoiIds = new Set(); // Track deleted POI IDs to survive replay

// Settings management
let showContactToggle = false;
let showPoiToggle = false;

// DOM elements
const contactOverlay = document.getElementById('contactsOverlay');
const poiOverlay = document.getElementById('poiOverlay');
const settingsOverlay = document.getElementById('settingsOverlay');
const toggleBtn = document.getElementById('toggleOverlay');
const poiToggleBtn = document.getElementById('togglePoiOverlay');
const settingsBtn = document.getElementById('settingsButton');
const showContactToggleCheckbox = document.getElementById('showContactToggle');
const showPoiToggleCheckbox = document.getElementById('showPoiToggle');

// Load settings from localStorage
function loadSettings() {
    showContactToggle = localStorage.getItem('showContactToggle') === 'true';
    showPoiToggle = localStorage.getItem('showPoiToggle') === 'true';

    showContactToggleCheckbox.checked = showContactToggle;
    showPoiToggleCheckbox.checked = showPoiToggle;

    updateToggleVisibility();
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('showContactToggle', showContactToggle.toString());
    localStorage.setItem('showPoiToggle', showPoiToggle.toString());
}

// Update toggle button visibility based on settings
function updateToggleVisibility() {
    toggleBtn.style.display = showContactToggle ? 'block' : 'none';
    poiToggleBtn.style.display = showPoiToggle ? 'block' : 'none';
}

function initOverlay() {
    contactOverlay.style.display = 'none';
    poiOverlay.style.display = 'none';
    settingsOverlay.style.display = 'none';
    toggleBtn.textContent = '👤';

    // Load settings and update visibility
    loadSettings();
    console.log(tracks);

    toggleBtn.addEventListener('click', function () {
        contactOverlayVisible = !contactOverlayVisible;
        if (contactOverlayVisible) {
            poiOverlayVisible = false;
            settingsOverlayVisible = false;
        }
        showHideOverlays();
    });

    poiToggleBtn.addEventListener('click', function () {
        poiOverlayVisible = !poiOverlayVisible;
        if (poiOverlayVisible) {
            contactOverlayVisible = false;
            settingsOverlayVisible = false;
        }
        showHideOverlays();
    });

    settingsBtn.addEventListener('click', function () {
        settingsOverlayVisible = !settingsOverlayVisible;
        if (settingsOverlayVisible) {
            contactOverlayVisible = false;
            poiOverlayVisible = false;
        }
        showHideOverlays();
    });

    // Settings checkbox event listeners
    showContactToggleCheckbox.addEventListener('change', function () {
        showContactToggle = this.checked;
        saveSettings();
        updateToggleVisibility();
    });

    showPoiToggleCheckbox.addEventListener('change', function () {
        showPoiToggle = this.checked;
        saveSettings();
        updateToggleVisibility();
    });
}

// Global function to show/hide overlays
function showHideOverlays() {
    contactOverlay.style.display = contactOverlayVisible ? 'block' : 'none';
    poiOverlay.style.display = poiOverlayVisible ? 'block' : 'none';
    settingsOverlay.style.display = settingsOverlayVisible ? 'block' : 'none';
}

// Update the contacts overlay
function updateContactsOverlay() {
    const contactsList = document.getElementById('contactsList');

    if (contactsData.size === 0) {
        contactsList.innerHTML =
            '<div class="no-items">No contacts shared their location yet</div>';
        // Only hide contact toggle if setting is disabled, otherwise respect the setting
        if (!showContactToggle) {
            toggleBtn.style.display = 'none';
        }
        return;
    }

    if (contactsData.size > 1) {
        toggleBtn.textContent = '👥';
    }

    // Show contact toggle button if there are contacts AND setting is enabled
    toggleBtn.style.display = showContactToggle ? 'block' : 'none';

    let html = '';
    contactsData.forEach((contact, contactId) => {
        const timeAgo = formatTimeAgo(contact.lastTimestamp);
        html += `
            <div class="contact-item" onclick="zoomToContact('${contactId}')">
                <div class="contact-color" style="background-color: ${
                    contact.color
                }"></div>
                <div class="contact-name">${htmlentities(contact.name)}</div>
                <div class="contact-time">${timeAgo}</div>
                <button class="item-button">📍</button>
            </div>
        `;
    });

    contactsList.innerHTML = html;
}

// Update the POI overlay
function updatePoiOverlay() {
    const poiList = document.getElementById('poiList');

    if (poiData.size === 0) {
        poiList.innerHTML = '<div class="no-contacts">No POIs yet</div>';
        // Only hide POI toggle if setting is disabled, otherwise respect the setting
        if (!showPoiToggle) {
            poiToggleBtn.style.display = 'none';
        }
        return;
    }

    // Show POI toggle button if there are POIs AND setting is enabled
    poiToggleBtn.style.display = showPoiToggle ? 'block' : 'none';

    let html = '';
    poiData.forEach((poi, poiId) => {
        const timeAgo = formatTimeAgo(poi.timestamp);
        html += `
            <div class="contact-item poi-item" data-poi-id="${poiId}">
                <div class="contact-color" style="background-color: ${
                    poi.color
                }"></div>
                <div class="contact-name">${htmlentities(
                    poi.label || poi.name
                )}</div>
                <div class="contact-time">${timeAgo}</div>
                <button class="item-button poi-zoom-button" title="Zoom to POI">📍</button>
                <button class="item-button delete-button poi-delete-button" title="Delete POI">🗑</button>
            </div>
        `;
    });

    poiList.innerHTML = html;

    const poiItems = poiList.querySelectorAll('.poi-item');
    poiItems.forEach((item) => {
        item.addEventListener('click', function (event) {
            const poiId = this.dataset.poiId;
            if (!poiId) {
                return;
            }

            const clickedButton = event.target.closest('button');
            if (
                clickedButton &&
                clickedButton.classList.contains('poi-delete-button')
            ) {
                deletePoi(poiId);
                return;
            }

            zoomToPoi(poiId);
        });
    });
}

// Format timestamp to relative time (e.g., "2h ago", "30m ago", "3d ago")
function formatTimeAgo(timestamp) {
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
function zoomToContact(contactId) {
    const contact = contactsData.get(contactId);
    if (contact && contact.lastPosition) {
        zoomToPosition(contact.lastPosition);
    } else {
        console.log('Contact not found or no position');
    }
}

// Function to zoom to a specific POI
function zoomToPoi(poiId) {
    console.log('poiData contents:', poiData);
    const poi = poiData.get(poiId);
    console.log('Found poi:', poi);
    if (poi && poi.position) {
        zoomToPosition(poi.position);
    } else {
        console.log('POI not found or no position');
    }
}

async function deletePoi(poiId) {
    const poi = poiData.get(poiId);
    if (!poi) {
        return;
    }

    const poiTitle = poi.label || poi.name || 'this POI';
    const confirmed = await showConfirmDialog(`Delete "${poiTitle}"?`);
    if (!confirmed) {
        return;
    }

    try {
        webxdc.sendUpdate(
            {
                payload: {
                    action: 'poi_delete',
                    poiId: poiId,
                    timestamp: Math.floor(Date.now() / 1000),
                },
            },
            'POI deleted: ' + poiTitle
        );
    } catch (error) {
        console.error('Failed to send POI delete update:', error);
    }

    removePoiById(poiId);
}

function removePoiById(poiId) {
    const poi = poiData.get(poiId);
    if (poi && poi.marker && map.hasLayer(poi.marker)) {
        map.removeLayer(poi.marker);
    }

    poiData.delete(poiId);
    updatePoiOverlay();
}

function showConfirmDialog(message) {
    const backdrop = document.getElementById('confirmDialogBackdrop');
    const text = document.getElementById('confirmDialogText');
    const cancelBtn = document.getElementById('confirmDialogCancel');
    const deleteBtn = document.getElementById('confirmDialogDelete');

    return new Promise((resolve) => {
        text.textContent = message;
        backdrop.classList.add('visible');

        function cleanupAndResolve(value) {
            backdrop.classList.remove('visible');
            cancelBtn.removeEventListener('click', onCancel);
            deleteBtn.removeEventListener('click', onDelete);
            backdrop.removeEventListener('click', onBackdropClick);
            document.removeEventListener('keydown', onKeyDown);
            resolve(value);
        }

        function onCancel() {
            cleanupAndResolve(false);
        }

        function onDelete() {
            cleanupAndResolve(true);
        }

        function onBackdropClick(event) {
            if (event.target === backdrop) {
                cleanupAndResolve(false);
            }
        }

        function onKeyDown(event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                cleanupAndResolve(false);
                return;
            }

            if (event.key === 'Enter') {
                event.preventDefault();
                cleanupAndResolve(true);
            }
        }

        cancelBtn.addEventListener('click', onCancel);
        deleteBtn.addEventListener('click', onDelete);
        backdrop.addEventListener('click', onBackdropClick);
        document.addEventListener('keydown', onKeyDown);
        cancelBtn.focus();
    });
}

function deletePoiFromPopup(poiId) {
    deletePoi(poiId);
}

function zoomToPosition(position) {
    map.setView(position, 15, { animate: true, duration: 1.2 });
}

// Initialize overlay when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    initOverlay();
    updateContactsOverlay();
    updatePoiOverlay();
});

const tracks = {};
let initDone = false;

/**
 * @type {Payload}
 * Example payload:
 * {
 *   action:     "pos",
 *   lat:        47.994828,
 *   lng:        7.849881,
 *   timestamp:  1712928222,
 *   contactId:  123,    // can be used as a unique ID to differ tracks etc
 *   name:       "Alice",
 *   color:      "#ff8080",
 *   independent: false, // false: current or past position of contact, true: a POI
 *   label:       ""     // used for POI only
 * }
 */
window.webxdc
    .setUpdateListener((update) => {
        const payload = update.payload;

        if (payload.action === 'poi_delete') {
            if (payload.poiId) {
                deletedPoiIds.add(payload.poiId);
                removePoiById(payload.poiId);
                console.log('Deleted POI with ID:', payload.poiId);
            }
            return;
        }

        if (payload.action === 'pos') {
            if (payload.independent) {
                // Store POI data for overlay
                const poiId = payload.poiId ||
                    'poi_' +
                    Date.now() +
                    '_' +
                    Math.random().toString(36).substr(2, 9);
                const poiDataObj = {
                    name: payload.name,
                    label: payload.label,
                    color: payload.color,
                    position: [payload.lat, payload.lng],
                    timestamp: payload.timestamp,
                };
                console.log('Adding POI with ID:', poiId, 'Data:', poiDataObj);
                poiData.set(poiId, poiDataObj);

                // Update POI overlay
                updatePoiOverlay();

                const marker = new L.Marker([payload.lat, payload.lng], {
                    icon: pinIcon,
                }).addTo(map);
                poiDataObj.marker = marker;
                if (payload.label) {
                    marker
                        .bindTooltip(shortLabelHtml(payload.label), {
                            permanent: true,
                            interactive: true,
                            direction: 'bottom',
                            offset: [0, -17],
                            className: 'poi-tooltip',
                        })
                        .openTooltip();
                }
                marker.on('click', function () {
                    if (!marker.getPopup()) {
                        marker
                            .bindPopup(popupHtml(payload, poiId), {
                                closeButton: false,
                            })
                            .openPopup();
                    }
                });
            } else {
                // Update contacts data for overlay
                if (!contactsData.has(payload.contactId)) {
                    contactsData.set(payload.contactId, {
                        name: payload.name,
                        color: payload.color,
                        lastPosition: [payload.lat, payload.lng],
                        lastTimestamp: payload.timestamp,
                    });
                } else {
                    const contact = contactsData.get(payload.contactId);
                    contact.name = payload.name;
                    contact.color = payload.color;
                    contact.lastPosition = [payload.lat, payload.lng];
                    contact.lastTimestamp = payload.timestamp;
                }

                // Update overlay
                updateContactsOverlay();

                if (!tracks[payload.contactId]) {
                    tracks[payload.contactId] = {
                        lines: [[]],
                        payload: payload,
                        lastTimestamp: payload.timestamp,
                        marker: null,
                        polyline: null,
                    };
                } else {
                    tracks[payload.contactId].payload = payload;
                }

                let lastLine = tracks[payload.contactId].lines.length - 1;
                if (
                    payload.timestamp -
                        tracks[payload.contactId].lastTimestamp >
                    5 * 60
                ) {
                    // larger time difference: start new line and connect with previous point on track
                    if (tracks[payload.contactId].lines[lastLine].length == 1) {
                        tracks[payload.contactId].lines[lastLine].push(
                            tracks[payload.contactId].lines[lastLine][0]
                        );
                    }
                    tracks[payload.contactId].lines.push([]);
                    lastLine++;
                }

                tracks[payload.contactId].lines[lastLine].push([
                    payload.lat,
                    payload.lng,
                ]);
                tracks[payload.contactId].lastTimestamp = payload.timestamp;
                if (initDone) {
                    updateTrack(payload.contactId);
                }
            }
        }
    })
    .then(() => {
        updateTracks();
        initDone = true;
    });

// contact's tracks

function updateTrack(contactId) {
    const track = tracks[contactId];

    if (track.polyline) {
        map.removeLayer(track.polyline);
    }
    track.polyline = new L.Polyline(track.lines, {
        color: track.payload.color,
        weight: 4,
    }).addTo(map);

    let content =
        '<span class="ppl-name" style="background-color:' +
        track.payload.color +
        ';">' +
        shortLabelHtml(track.payload.name) +
        "</span>";
    const age = Math.floor(Date.now() / 1000) - track.payload.timestamp;
    if (age > 60 * 60) {
        content +=
            '<br><span class="ppl-time">' +
            Math.floor(age / 60 / 60) +
            "h ago</span>";
    } else if (age > 30 * 60) {
        content += '<br><span class="ppl-time">½h ago</span>';
    } else if (age > 15 * 60) {
        content += '<br><span class="ppl-time">¼h ago</span>';
    } else {
        content += '<br><span class="ppl-online"></span>';
    }

    const lastLine = track.lines.length - 1;
    const lastLatLng = track.lines[lastLine][track.lines[lastLine].length - 1];
    if (track.marker) {
        map.removeLayer(track.marker);
    }
    track.marker = new L.Marker(lastLatLng, {
        icon: pinIcon,
        opacity: 0,
    }).addTo(map);
    const tooltip = new L.Tooltip({
        content: content,
        permanent: true,
        interactive: true,
        direction: 'bottom',
        offset: [0, -28],
        className: 'ppl-tooltip',
    });
    track.marker.bindTooltip(tooltip).openTooltip();
    track.marker.unbindPopup();
    track.marker.on('click', function () {
        if (!track.marker.getPopup()) {
            track.marker
                .bindPopup(popupHtml(track.payload), { closeButton: false })
                .openPopup();
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
}, 60 * 1000);

// share a dedicated location

let popup;
let popupLatlng;

function onSend() {
    const elem = document.getElementById('textToSend');
    const value = elem.value.trim();
    if (value != '') {
        const poiId =
            'poi_' +
            Date.now() +
            '_' +
            Math.random().toString(36).substr(2, 9);
        popup.close();
        webxdc.sendUpdate(
            {
                payload: {
                    action: 'pos',
                    independent: true,
                    poiId: poiId,
                    timestamp: Math.floor(Date.now() / 1000),
                    lat: popupLatlng.lat,
                    lng: popupLatlng.lng,
                    label: elem.value,
                    name: webxdc.selfName,
                    color: '#888',
                },
            },
            'POI added to map at ' +
                popupLatlng.lat.toFixed(4) +
                '/' +
                popupLatlng.lng.toFixed(4) +
                ' with text: ' +
                value
        );
    } else {
        elem.placeholder =
            elem.placeholder == 'Label' ? 'Enter label' : 'Label'; // just some cheap visual feedback
    }
}

function onMapLongClick(e) {
    popupLatlng = e.latlng;
    popup = new L.Popup({ closeButton: false, keepInView: true })
        .setLatLng(popupLatlng)
        .setContent(
            '<div class="formx"><img src="images/pin-icon.png"><br><input type=text size=9 id=textToSend placeholder="Label"><br><button onclick="onSend()">Send</button></div>'
        )
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

// Close overlays when clicking on the map
map.on('click', function () {
    contactOverlayVisible = false;
    poiOverlayVisible = false;
    settingsOverlayVisible = false;
    showHideOverlays();
});

// tools

function htmlentities(rawStr) {
    return rawStr.replace(
        /[\u00A0-\u9999<>\&]/g,
        (i) => `&#${i.charCodeAt(0)};`
    );
}

function shortLabelHtml(label) {
    if (label.length > 9) {
        label = htmlentities(label.substring(0, 8).trim()) + '..';
    } else if (label.length <= 4) {
        const padding = '&nbsp;'.repeat((7 - label.length) / 2);
        label = padding + htmlentities(label) + padding;
    }
    return label;
}

function popupHtml(payload, poiId = null) {
    let html =
        '<div><small><b style="color:' +
        payload.color +
        '">' +
        htmlentities(payload.name) +
        '</b></small></div>' +
        (payload.label ? '<div>' + htmlentities(payload.label) + '</div>' : '') +
        '<div><small>' +
        payload.lat.toFixed(4) +
        '°/' +
        payload.lng.toFixed(4) +
        '°<br>' +
        htmlentities(new Date(payload.timestamp * 1000).toLocaleString()) +
        '</small></div>';

    if (poiId) {
        html +=
            '<div class="popup-delete-row">' +
            '<button class="popup-delete-button" onclick="deletePoiFromPopup(\'' +
            poiId +
            '\')" title="Delete POI">🗑</button>' +
            '</div>';
    }

    return html;
}
