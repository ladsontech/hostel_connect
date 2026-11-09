import { Hostel, Offer } from '@/types';

// Normalization stopwords commonly found in Uganda hostel names
const STOP_WORDS = new Set([
  'hostel',
  'hostels',
  'residence',
  'hall',
  'inn',
  'campus',
  'lodge',
  'villa',
  'house',
  'suites',
  'apartments',
  'the',
  'and',
  '&',
  'kikoni',
  'makerere',
  'banda',
  'nakawa',
  'katanga',
  'sir apollo'
]);

/**
 * Normalizes name for trigram comparison:
 * lowercase, removes punctuation, removes noise words like "Hostel", "Residence"
 */
export function normalizeHostelName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0 && !STOP_WORDS.has(word))
    .join(' ')
    .trim();

  return cleaned || name.toLowerCase().trim();
}

/**
 * Generates trigrams (character 3-grams) for similarity matching
 */
function getTrigrams(str: string): Set<string> {
  const trigrams = new Set<string>();
  const padded = `  ${str} `;
  for (let i = 0; i < padded.length - 2; i++) {
    trigrams.add(padded.substring(i, i + 3));
  }
  return trigrams;
}

/**
 * Trigram similarity metric (Sørensen–Dice coefficient over character trigrams)
 * Returns similarity between 0.0 and 1.0
 */
export function trigramSimilarity(str1: string, str2: string): number {
  const s1 = normalizeHostelName(str1);
  const s2 = normalizeHostelName(str2);

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const t1 = getTrigrams(s1);
  const t2 = getTrigrams(s2);

  let intersection = 0;
  t1.forEach(item => {
    if (t2.has(item)) intersection++;
  });

  const total = t1.size + t2.size;
  if (total === 0) return 0;
  return (2 * intersection) / total;
}

/**
 * Haversine formula to compute great-circle distance in meters between two coordinates
 */
export function calculateGpsDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius of Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export interface DuplicateCheckResult {
  isPotentialDuplicate: boolean;
  matchReasons: string[];
  matchedHostel?: Hostel;
  nameSimilarity?: number;
  distanceMeters?: number;
}

/**
 * Section 5 SRS Duplicate Check Engine:
 * 1. Fuzzy name match (trigram threshold ~0.6)
 * 2. GPS proximity (within 75 metres)
 * 3. Phone match (Custodian phone already attached to hostel)
 */
export function checkForDuplicates(
  candidate: {
    name: string;
    lat: number;
    lng: number;
    custodianPhone?: string;
  },
  existingHostels: Hostel[],
  existingOffers: Offer[]
): DuplicateCheckResult {
  for (const hostel of existingHostels) {
    const reasons: string[] = [];

    // 1. Trigram Name Similarity
    const similarity = trigramSimilarity(candidate.name, hostel.name);
    if (similarity >= 0.58) {
      reasons.push(
        `High name similarity (${Math.round(similarity * 100)}%) with "${hostel.name}"`
      );
    }

    // 2. GPS Proximity within 75 meters
    const distanceMeters = calculateGpsDistanceMeters(
      candidate.lat,
      candidate.lng,
      hostel.lat,
      hostel.lng
    );
    if (distanceMeters <= 75) {
      reasons.push(`Located only ${distanceMeters}m away from "${hostel.name}" (within 75m threshold)`);
    }

    // 3. Phone match for Custodian
    if (candidate.custodianPhone) {
      const cleanCandPhone = candidate.custodianPhone.replace(/\D/g, '');
      const phoneMatches = existingOffers.some(
        o =>
          o.hostelId === hostel.id &&
          o.userRole === 'custodian' &&
          o.contactPhone.replace(/\D/g, '') === cleanCandPhone
      );
      if (phoneMatches) {
        reasons.push(`Custodian phone number is already attached to "${hostel.name}"`);
      }
    }

    if (reasons.length > 0) {
      return {
        isPotentialDuplicate: true,
        matchReasons: reasons,
        matchedHostel: hostel,
        nameSimilarity: similarity,
        distanceMeters,
      };
    }
  }

  return {
    isPotentialDuplicate: false,
    matchReasons: [],
  };
}
