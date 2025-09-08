const defaultServiceKey = 'OSmap.de';
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
    },
    '高德路况': {
        url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        subdomains: '1234',
        options: {
            maxZoom: 18,
            attribution: '© 高德路况'
        },
        annotationLayer: {
            url: 'https://tm.amap.com/trafficengine/mapabc/traffictile?v=1.0&=&=&t=1&t=1&x={x}&y={y}&z={z}',
            options: {
                maxZoom: 18
            }
        }
    },
    '高德卫星': {
        url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        subdomains: '1234',
        options: {
            maxZoom: 18,
            attribution: '© 高德卫星'
        },
        annotationLayer: {
            url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}',
            subdomains: '1234',
            options: {
                maxZoom: 18
            }
        }
    },
    '腾讯地图': {
        url: 'https://rt{s}.map.gtimg.com/tile?z={z}&x={x}&y={y}&type=vector&styleid=1',
        subdomains: '012',
        options: {
            maxZoom: 18,
	     tms: true,
            attribution: '© 腾讯地图'
        }
    },
    '天地图': {
        url: 'https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec_w&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=75f0434f240669f4a2df6359275146d2',
        subdomains: '01234567',//['0', '1', '2', '3', '4', '5', '6', '7'],
        options: {
            maxZoom: 18,
            attribution: '© 天地图'
        },
        annotationLayer: {
            url: 'https://t{s}.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=75f0434f240669f4a2df6359275146d2',
            subdomains: '01234567',
            options: {
                maxZoom: 18
            }
        }
    },
    '天地图卫星': {
        url: 'https://t{s}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=75f0434f240669f4a2df6359275146d2',
        subdomains: '01234567',
        options: {
            maxZoom: 18,
            attribution: '© 天地图'
        },
        annotationLayer: {
            url: 'https://t{s}.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=75f0434f240669f4a2df6359275146d2',
            subdomains: '01234567',
            options: {
                maxZoom: 18
            }
        }
    }
};
