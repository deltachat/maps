const defaultServiceKey = 'OpenStreetMap';
const mapServices = {
    'OpenStreetMap': {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        options: {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }
    },
    'OSmap.de': {
        url: 'https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c', 'd'],
        options: {
            maxZoom: 18,
            attribution: '© OSmap.de'
        }
    },
    'OSmap.fr': {
        url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c'],
        options: {
            maxZoom: 18,
            attribution: '© OSmap.fr'
        }
    },
    'opentopomap': {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c'],
        options: {
            maxZoom: 18,
            attribution: '© opentopomap'
        }
    },
    '高德地图': {
        url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        subdomains: '1234',
        options: {
            maxZoom: 18,
            attribution: '© 高德地图'
        }
    }
};
