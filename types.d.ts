// Application-specific type definitions (not library types)

interface Payload {
    action: string;
    lat: number;
    lng: number;
    timestamp: number;
    contactId: number;
    name: string;
    color: string;
    independent: boolean;
    label?: string;
}

interface ContactData {
    name: string;
    color: string;
    lastPosition: [number, number];
    lastTimestamp: number;
}

interface PoiData {
    name: string;
    label?: string;
    color: string;
    position: [number, number];
    timestamp: number;
}

interface Track {
    lines: [number, number][][];
    payload: Payload;
    lastTimestamp: number;
    marker: L.Marker | null;
    polyline: L.Polyline | null;
}

interface Tracks {
    [contactId: number]: Track;
}
