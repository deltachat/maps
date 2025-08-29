const defaultServiceKey = 'OpenStreetMap'; 
const mapServices = {
    'OpenStreetMap': {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }
    },
    'opentopomap': {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c'],
        options: {
            maxZoom: 18,
            attribution: '© opentopomap'
        }
    }
};
