// GPS simulation helpers for development/preview only.
// This file is excluded from the .xdc build.

var _simulateGpsIntervals = [];

window.stopSimulateGps = () => {
    _simulateGpsIntervals.forEach(clearInterval);
    _simulateGpsIntervals = [];
    console.log('[SimGPS] Stopped all simulations.');
};

/**
 * Simulate a GPS sender sending periodic position updates.
 * @param {object} opts
 * @param {string} [opts.name]       - Display name (default: "SimUser")
 * @param {string} [opts.color]      - Hex color (default: random)
 * @param {number} [opts.lat]        - Starting latitude (default: 48.137)
 * @param {number} [opts.lng]        - Starting longitude (default: 11.576)
 * @param {number} [opts.steps]      - Number of updates to send (default: 30)
 * @param {number} [opts.intervalMs] - Milliseconds between updates (default: 1500)
 * @param {number} [opts.drift]      - Max random lat/lng drift per step (default: 0.001)
 */
window.simulateGps = (opts = {}) => {
    var name       = opts.name       || 'SimUser';
    var color      = opts.color      || ('#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'));
    var lat        = opts.lat        !== undefined ? opts.lat : 48.137;
    var lng        = opts.lng        !== undefined ? opts.lng : 11.576;
    var steps      = opts.steps      !== undefined ? opts.steps : 30;
    var intervalMs = opts.intervalMs !== undefined ? opts.intervalMs : 1500;
    var drift      = opts.drift      !== undefined ? opts.drift : 0.001;
    var contactId  = 'simgps_' + name.replace(/\s+/g, '_') + '_' + Date.now();

    var step = 0;
    console.log('[SimGPS] Starting simulation for "' + name + '" color=' + color + ' steps=' + steps);

    var iv = setInterval(() => {
        if (step >= steps) {
            clearInterval(iv);
            _simulateGpsIntervals = _simulateGpsIntervals.filter(x => x !== iv);
            console.log('[SimGPS] Simulation done for "' + name + '"');
            return;
        }
        lat += (Math.random() - 0.5) * drift * 2;
        lng += (Math.random() - 0.5) * drift * 2;

        window.webxdc.sendUpdate({
            payload: {
                action: 'pos',
                lat: Math.round(lat * 1e6) / 1e6,
                lng: Math.round(lng * 1e6) / 1e6,
                timestamp: Math.floor(Date.now() / 1000),
                contactId: contactId,
                name: name,
                color: color,
                independent: false,
            }
        }, name + ' position update ' + (step + 1));

        step++;
    }, intervalMs);

    _simulateGpsIntervals.push(iv);
};
