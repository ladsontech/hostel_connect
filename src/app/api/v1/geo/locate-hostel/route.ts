import { NextResponse } from 'next/server';
import {
  formatDistanceLabel,
  getCampusGate,
  isInUganda,
  isValidLatLng,
  parseCoordinatesFromText,
} from '@/lib/campus-gates';
import { getDatabase } from '@/lib/data-store';
import {
  calculateGpsDistanceMeters,
  trigramSimilarity,
} from '@/lib/duplicate-detector';

export interface LocatedHostelCandidate {
  id: string;
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  area: string;
  address: string;
  landmark: string;
  provider: 'Google Maps' | 'Google Maps Link' | 'OpenStreetMap' | 'Hostel Directory';
  googleMapsUrl: string;
  straightMeters: number;
  routeMeters: number;
  walkMinutes: number;
  routeMode: 'walking_route' | 'straight_line';
  distanceLabel: string;
  gateName: string;
  score: number;
}

interface RawGeoMatch {
  name: string;
  displayName: string;
  lat: number;
  lng: number;
  area: string;
  address: string;
  landmark: string;
  provider: LocatedHostelCandidate['provider'];
}

const ALLOWED_MAPS_HOSTS = new Set([
  'maps.app.goo.gl',
  'goo.gl',
  'google.com',
  'www.google.com',
  'maps.google.com',
]);

function isAllowedGoogleMapsUrl(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' && ALLOWED_MAPS_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

async function resolveGoogleMapsLink(rawUrl: string): Promise<{
  lat: number;
  lng: number;
  resolvedName?: string;
} | null> {
  const direct = parseCoordinatesFromText(rawUrl);
  if (direct) {
    const placeMatch = rawUrl.match(/\/maps\/place\/([^/@?]+)/i);
    return {
      ...direct,
      resolvedName: placeMatch ? decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')) : undefined,
    };
  }

  if (!isAllowedGoogleMapsUrl(rawUrl)) return null;

  let currentUrl = rawUrl.trim();
  for (let hop = 0; hop < 4; hop++) {
    try {
      const res = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(4000),
        headers: { 'User-Agent': 'HostelConnect/1.0' },
      });

      const location = res.headers.get('location');
      if (location) {
        const nextUrl = new URL(location, currentUrl).toString();
        const coordsFromRedirect = parseCoordinatesFromText(nextUrl);
        if (coordsFromRedirect) {
          const placeMatch = nextUrl.match(/\/maps\/place\/([^/@?]+)/i);
          return {
            ...coordsFromRedirect,
            resolvedName: placeMatch
              ? decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
              : undefined,
          };
        }
        if (!isAllowedGoogleMapsUrl(nextUrl)) break;
        currentUrl = nextUrl;
        continue;
      }

      const html = await res.text();
      const coordsFromBody = parseCoordinatesFromText(html);
      if (coordsFromBody) {
        return coordsFromBody;
      }
      break;
    } catch {
      break;
    }
  }

  return null;
}

async function fetchGooglePlacesMatches(
  query: string,
  campus: string,
  apiKey: string
): Promise<RawGeoMatch[]> {
  const gate = getCampusGate(campus);
  const fullQuery = `${query} near ${gate.cityBias}, Uganda`;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
    fullQuery
  )}&location=${gate.lat},${gate.lng}&radius=12000&region=ug&key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.results)) return [];

    return data.results.slice(0, 4).flatMap((item: any): RawGeoMatch[] => {
      const lat = item?.geometry?.location?.lat;
      const lng = item?.geometry?.location?.lng;
      if (!isValidLatLng(lat, lng) || !isInUganda(lat, lng)) return [];
      const formatted = String(item.formatted_address || '');
      const parts = formatted
        .split(',')
        .map((p: string) => p.trim())
        .filter(Boolean);
      const area = parts.length > 1 ? parts[parts.length - 2] || gate.defaultArea : gate.defaultArea;

      return [
        {
          name: String(item.name || query),
          displayName: formatted ? `${item.name} — ${formatted}` : String(item.name || query),
          lat,
          lng,
          area: area === 'Uganda' ? gate.defaultArea : area,
          address: formatted || `${area}, ${gate.cityBias}`,
          landmark: parts[0] && parts[0] !== item.name ? `Near ${parts[0]}` : '',
          provider: 'Google Maps',
        },
      ];
    });
  } catch {
    return [];
  }
}

async function fetchNominatimMatches(query: string, campus: string): Promise<RawGeoMatch[]> {
  const gate = getCampusGate(campus);
  const searchQueries = [`${query}, ${gate.cityBias}, Uganda`, `${query}, Uganda`];
  const matches: RawGeoMatch[] = [];

  for (const q of searchQueries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        q
      )}&format=jsonv2&limit=5&addressdetails=1&countrycodes=ug`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(4500),
        headers: {
          'User-Agent': 'HostelConnectUganda/1.0 (campus-housing-locator)',
          'Accept-Language': 'en',
        },
      });
      if (!res.ok) continue;
      const rows = await res.json();
      if (!Array.isArray(rows)) continue;

      for (const row of rows) {
        const lat = parseFloat(row.lat);
        const lng = parseFloat(row.lon);
        if (!isValidLatLng(lat, lng) || !isInUganda(lat, lng)) continue;

        const addr = row.address || {};
        const area =
          addr.neighbourhood ||
          addr.suburb ||
          addr.quarter ||
          addr.city_district ||
          addr.town ||
          addr.village ||
          addr.county ||
          gate.defaultArea;
        const road = addr.road || addr.street || '';
        const name = String(row.name || row.display_name?.split(',')[0] || query).trim();

        matches.push({
          name,
          displayName: String(row.display_name || name),
          lat,
          lng,
          area,
          address: road ? `${road}, ${area}` : `${area}, ${gate.cityBias}`,
          landmark: road ? `Along ${road}` : `Near ${area}`,
          provider: 'OpenStreetMap',
        });
      }

      if (matches.length >= 3) break;
    } catch {
      // Ignore transient geocoder failure and proceed with fallback providers
    }
  }

  return matches;
}

async function fetchPhotonMatches(query: string, campus: string): Promise<RawGeoMatch[]> {
  const gate = getCampusGate(campus);
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(
      `${query} ${gate.cityBias} Uganda`
    )}&lat=${gate.lat}&lon=${gate.lng}&limit=5`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data?.features)) return [];

    return data.features.flatMap((feat: any): RawGeoMatch[] => {
      const coords = feat?.geometry?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) return [];
      const lng = Number(coords[0]);
      const lat = Number(coords[1]);
      if (!isValidLatLng(lat, lng) || !isInUganda(lat, lng)) return [];

      const props = feat.properties || {};
      if (props.countrycode && String(props.countrycode).toUpperCase() !== 'UG') {
        return [];
      }

      const name = String(props.name || query).trim();
      const area = props.locality || props.district || props.city || gate.defaultArea;
      const street = props.street || '';
      const displayParts = [name, street, area, props.city || 'Uganda'].filter(Boolean);

      return [
        {
          name,
          displayName: displayParts.join(', '),
          lat,
          lng,
          area,
          address: street ? `${street}, ${area}` : `${area}, ${gate.cityBias}`,
          landmark: street ? `Along ${street}` : '',
          provider: 'OpenStreetMap',
        },
      ];
    });
  } catch {
    return [];
  }
}

function getLocalHostelMatches(query: string, campus: string): RawGeoMatch[] {
  const db = getDatabase();
  const qLower = query.trim().toLowerCase();
  if (!qLower) return [];

  return db.hostels
    .map(h => {
      const directHit =
        h.name.toLowerCase().includes(qLower) || qLower.includes(h.name.toLowerCase());
      const sim = trigramSimilarity(query, h.name);
      return { hostel: h, score: directHit ? Math.max(0.85, sim) : sim };
    })
    .filter(item => item.score >= 0.45)
    .sort((a, b) => {
      const aCampusMatch = a.hostel.campus === campus ? 0.15 : 0;
      const bCampusMatch = b.hostel.campus === campus ? 0.15 : 0;
      return b.score + bCampusMatch - (a.score + aCampusMatch);
    })
    .slice(0, 3)
    .map(({ hostel }) => ({
      name: hostel.name,
      displayName: `${hostel.name}, ${hostel.address || hostel.area}`,
      lat: hostel.lat,
      lng: hostel.lng,
      area: hostel.area,
      address: hostel.address,
      landmark: hostel.landmark,
      provider: 'Hostel Directory' as const,
    }));
}

async function computeDistanceToCampusGate(
  lat: number,
  lng: number,
  campus: string,
  googleApiKey?: string
): Promise<{
  straightMeters: number;
  routeMeters: number;
  walkMinutes: number;
  routeMode: 'walking_route' | 'straight_line';
  distanceLabel: string;
  gateName: string;
}> {
  const gate = getCampusGate(campus);
  const straightMeters = Math.max(
    10,
    calculateGpsDistanceMeters(lat, lng, gate.lat, gate.lng)
  );

  // 1. Prefer Google Distance Matrix walking route when API key is configured
  if (googleApiKey) {
    try {
      const dmUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=${gate.lat},${gate.lng}&mode=walking&key=${encodeURIComponent(
        googleApiKey
      )}`;
      const res = await fetch(dmUrl, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        const element = data?.rows?.[0]?.elements?.[0];
        if (element?.status === 'OK' && element?.distance?.value && element?.duration?.value) {
          const routeMeters = Math.round(element.distance.value);
          const walkMinutes = Math.max(1, Math.round(element.duration.value / 60));
          return {
            straightMeters,
            routeMeters,
            walkMinutes,
            routeMode: 'walking_route',
            distanceLabel: formatDistanceLabel(routeMeters, walkMinutes, gate.shortGateName),
            gateName: gate.gateName,
          };
        }
      }
    } catch {
      // Fall back cleanly to OSRM / Haversine below
    }
  }

  // 2. Free road-network routing via OSRM, converted at realistic walking speed (~75 m/min = 4.5 km/h)
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${lng},${lat};${gate.lng},${gate.lat}?overview=false`;
    const res = await fetch(osrmUrl, { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      const routeMetersRaw = data?.routes?.[0]?.distance;
      if (typeof routeMetersRaw === 'number' && Number.isFinite(routeMetersRaw) && routeMetersRaw > 0) {
        const routeMeters = Math.max(straightMeters, Math.round(routeMetersRaw));
        const walkMinutes = Math.max(1, Math.round(routeMeters / 75));
        return {
          straightMeters,
          routeMeters,
          walkMinutes,
          routeMode: 'walking_route',
          distanceLabel: formatDistanceLabel(routeMeters, walkMinutes, gate.shortGateName),
          gateName: gate.gateName,
        };
      }
    }
  } catch {
    // Fall through to pedestrian-adjusted Haversine estimate
  }

  // 3. Fallback: Haversine * 1.25 urban street-path multiplier (~75 m/min walking pace)
  const estimatedMeters = Math.round(straightMeters * 1.25);
  const walkMinutes = Math.max(1, Math.round(estimatedMeters / 75));
  return {
    straightMeters,
    routeMeters: estimatedMeters,
    walkMinutes,
    routeMode: 'straight_line',
    distanceLabel: formatDistanceLabel(estimatedMeters, walkMinutes, gate.shortGateName),
    gateName: gate.gateName,
  };
}

function deduplicateMatches(matches: RawGeoMatch[]): RawGeoMatch[] {
  const unique: RawGeoMatch[] = [];
  for (const candidate of matches) {
    const isDup = unique.some(
      existing =>
        calculateGpsDistanceMeters(existing.lat, existing.lng, candidate.lat, candidate.lng) < 40
    );
    if (!isDup) unique.push(candidate);
  }
  return unique;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      action = 'lookup',
      query = '',
      campus = 'Makerere University',
      mapsUrl = '',
      lat,
      lng,
    } = body;

    const googleApiKey =
      process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const gate = getCampusGate(campus);

    // Recalculate exact distance for an already chosen GPS pin (e.g. when changing University Campus)
    if (action === 'distance') {
      const parsedLat = Number(lat);
      const parsedLng = Number(lng);
      if (!isValidLatLng(parsedLat, parsedLng)) {
        return NextResponse.json(
          { success: false, error: 'Invalid latitude or longitude coordinates.' },
          { status: 400 }
        );
      }

      const dist = await computeDistanceToCampusGate(
        parsedLat,
        parsedLng,
        campus,
        googleApiKey
      );

      return NextResponse.json({
        success: true,
        gate,
        distance: dist,
      });
    }

    const rawInput = String(mapsUrl || query || '').trim();
    if (!rawInput || rawInput.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Enter a hostel name or paste a Google Maps link.' },
        { status: 400 }
      );
    }

    // Mode A: Direct Google Maps URL or raw "lat, lng"
    const looksLikeLinkOrCoords =
      /^https?:\/\//i.test(rawInput) ||
      Boolean(parseCoordinatesFromText(rawInput));

    if (looksLikeLinkOrCoords) {
      const resolved = await resolveGoogleMapsLink(rawInput);
      if (!resolved) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Could not read coordinates from that link. Try opening the hostel in Google Maps, copying the full link or "lat, lng", or searching by name.',
          },
          { status: 422 }
        );
      }

      const dist = await computeDistanceToCampusGate(
        resolved.lat,
        resolved.lng,
        campus,
        googleApiKey
      );
      const labelName = resolved.resolvedName || String(query || '').trim() || 'Pinned Hostel';
      const candidate: LocatedHostelCandidate = {
        id: `geo_link_${Date.now()}`,
        name: labelName,
        displayName: `${labelName} (${resolved.lat.toFixed(5)}, ${resolved.lng.toFixed(5)})`,
        lat: resolved.lat,
        lng: resolved.lng,
        area: gate.defaultArea,
        address: `Near ${gate.cityBias}`,
        landmark: `Pinned via Google Maps`,
        provider: 'Google Maps Link',
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${resolved.lat},${resolved.lng}`,
        ...dist,
        score: 1,
      };

      return NextResponse.json({
        success: true,
        gate,
        candidates: [candidate],
        bestMatch: candidate,
      });
    }

    // Mode B: Automatic map lookup by Hostel Name
    const cleanQuery = rawInput.trim();
    const rawPool: RawGeoMatch[] = [];

    if (googleApiKey) {
      rawPool.push(...(await fetchGooglePlacesMatches(cleanQuery, campus, googleApiKey)));
    }

    const [nominatimMatches, photonMatches] = await Promise.all([
      rawPool.length === 0 ? fetchNominatimMatches(cleanQuery, campus) : Promise.resolve([]),
      rawPool.length === 0 ? fetchPhotonMatches(cleanQuery, campus) : Promise.resolve([]),
    ]);

    rawPool.push(...nominatimMatches, ...photonMatches);

    // Supplement with existing verified Hostel Directory pins when external maps return sparse results
    if (rawPool.length < 3) {
      rawPool.push(...getLocalHostelMatches(cleanQuery, campus));
    }

    const uniqueRaw = deduplicateMatches(rawPool).slice(0, 4);
    if (uniqueRaw.length === 0) {
      return NextResponse.json({
        success: true,
        gate,
        candidates: [],
        bestMatch: null,
        message: `No automatic map pin found for "${cleanQuery}". You can paste its Google Maps link or tap "Use My Current GPS".`,
      });
    }

    const candidates: LocatedHostelCandidate[] = await Promise.all(
      uniqueRaw.map(async (item, idx) => {
        const dist = await computeDistanceToCampusGate(
          item.lat,
          item.lng,
          campus,
          googleApiKey
        );
        const nameScore = trigramSimilarity(cleanQuery, item.name);
        const proximityBonus = dist.straightMeters <= 5000 ? 0.25 : 0;
        const providerBonus =
          item.provider === 'Google Maps'
            ? 0.2
            : item.provider === 'OpenStreetMap'
            ? 0.1
            : 0.05;

        return {
          id: `geo_${idx}_${Math.round(item.lat * 10000)}`,
          name: item.name,
          displayName: item.displayName,
          lat: item.lat,
          lng: item.lng,
          area: item.area,
          address: item.address,
          landmark: item.landmark,
          provider: item.provider,
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`,
          ...dist,
          score: Number((nameScore + proximityBonus + providerBonus).toFixed(3)),
        };
      })
    );

    candidates.sort((a, b) => b.score - a.score || a.straightMeters - b.straightMeters);

    // Filter out distant false-positive towns (e.g. >35km away) when at least one local campus match exists
    const nearbyMatches = candidates.filter(c => c.straightMeters <= 35000);
    const finalCandidates = nearbyMatches.length > 0 ? nearbyMatches : candidates;

    return NextResponse.json({
      success: true,
      gate,
      candidates: finalCandidates,
      bestMatch: finalCandidates[0] || null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Location lookup failed' },
      { status: 500 }
    );
  }
}

