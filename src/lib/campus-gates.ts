export interface CampusGateInfo {
  campus: string;
  gateName: string;
  shortGateName: string;
  lat: number;
  lng: number;
  cityBias: string;
  defaultArea: string;
  /** Nominatim viewbox: left(minLng),top(maxLat),right(maxLng),bottom(minLat) */
  viewbox: string;
}

export const CAMPUS_GATES: Record<string, CampusGateInfo> = {
  'Makerere University': {
    campus: 'Makerere University',
    gateName: 'Makerere University Main Gate',
    shortGateName: 'Makerere Main Gate',
    lat: 0.3283,
    lng: 32.5715,
    cityBias: 'Kampala',
    defaultArea: 'Kikoni',
    viewbox: '32.52,0.37,32.61,0.29',
  },
  MUBS: {
    campus: 'MUBS',
    gateName: 'MUBS Main Gate (Nakawa)',
    shortGateName: 'MUBS Main Gate',
    lat: 0.3283,
    lng: 32.6164,
    cityBias: 'Nakawa Kampala',
    defaultArea: 'Nakawa',
    viewbox: '32.58,0.36,32.66,0.30',
  },
  'Kyambogo University': {
    campus: 'Kyambogo University',
    gateName: 'Kyambogo University Main Gate',
    shortGateName: 'Kyambogo Main Gate',
    lat: 0.3500,
    lng: 32.6300,
    cityBias: 'Kyambogo Banda Kampala',
    defaultArea: 'Banda',
    viewbox: '32.59,0.38,32.67,0.32',
  },
  'Uganda Christian University': {
    campus: 'Uganda Christian University',
    gateName: 'UCU Main Gate (Mukono)',
    shortGateName: 'UCU Main Gate',
    lat: 0.3575,
    lng: 32.7414,
    cityBias: 'Mukono',
    defaultArea: 'Kauga',
    viewbox: '32.69,0.40,32.79,0.32',
  },
  KIU: {
    campus: 'KIU',
    gateName: 'KIU Main Gate (Kansanga)',
    shortGateName: 'KIU Main Gate',
    lat: 0.2947,
    lng: 32.6036,
    cityBias: 'Kansanga Kampala',
    defaultArea: 'Kansanga',
    viewbox: '32.56,0.33,32.64,0.26',
  },
};

export function getCampusGate(campus: string): CampusGateInfo {
  return CAMPUS_GATES[campus] || CAMPUS_GATES['Makerere University'];
}

export function formatDistanceLabel(
  distanceMeters: number,
  walkMinutes: number,
  gateShortName: string
): string {
  const safeMeters = Math.max(10, Math.round(distanceMeters));
  const safeMinutes = Math.max(1, Math.round(walkMinutes));
  const distStr =
    safeMeters >= 1000
      ? `${(safeMeters / 1000).toFixed(1)} km`
      : `${safeMeters} m`;
  return `${distStr} (${safeMinutes} min walk) to ${gateShortName}`;
}

export function parseCoordinatesFromText(
  input: string
): { lat: number; lng: number } | null {
  const text = input.trim();
  if (!text) return null;

  // Match @lat,lng in Google Maps URLs (e.g. /@0.3358934,32.5604196,17z)
  const atMatch = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  // Match !3dLAT!4dLNG in embedded/place Google Maps URLs
  const pbMatch = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (pbMatch) {
    const lat = parseFloat(pbMatch[1]);
    const lng = parseFloat(pbMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  // Match ?q=lat,lng or &ll=lat,lng or ?center=lat,lng
  const queryCoordMatch = text.match(
    /[?&](?:q|ll|center|destination)=(-?\d+(?:\.\d+)?)(?:%2C|,)\s*(-?\d+(?:\.\d+)?)/i
  );
  if (queryCoordMatch) {
    const lat = parseFloat(queryCoordMatch[1]);
    const lng = parseFloat(queryCoordMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  // Match raw "0.3358, 32.5604"
  const rawMatch = text.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (rawMatch) {
    const lat = parseFloat(rawMatch[1]);
    const lng = parseFloat(rawMatch[2]);
    if (isValidLatLng(lat, lng)) return { lat, lng };
  }

  return null;
}

export function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/** Rough Uganda bounding box check so global false-positive places don't override local hostels */
export function isInUganda(lat: number, lng: number): boolean {
  return lat >= -1.6 && lat <= 4.3 && lng >= 29.4 && lng <= 35.1;
}

