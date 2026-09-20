export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeofenceResult {
  distanceMeters: number;
  isWithinRange: boolean;
  formattedDistance: string;
}

/**
 * Calculates great-circle distance between two GPS coordinates using Haversine formula
 * Returns distance in exact meters.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000.0; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180.0;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Checks whether user coordinates are within threshold (default: 5 meters) of target
 */
export function checkGeofence(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  maxMeters: number = 5
): GeofenceResult {
  const dist = calculateHaversineDistance(userLat, userLon, targetLat, targetLon);
  return {
    distanceMeters: dist,
    isWithinRange: dist <= maxMeters,
    formattedDistance: formatDistance(dist),
  };
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m away`;
  }
  return `${(meters / 1000).toFixed(1)} km away`;
}

/**
 * Detailed GPS lookup returning the coordinates plus a flag indicating
 * whether the result is a fallback (permission denied / unavailable).
 * Screens should migrate to this; getCurrentGPS() is kept for compat.
 */
export async function getCurrentGPSDetailed(): Promise<{ coords: Coordinates; isFallback: boolean }> {
  try {
    const Location = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        coords: {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        },
        isFallback: false,
      };
    }
  } catch (err) {
    // Fallback if running on simulator or web without GPS
  }

  // Default reference coordinate (Ward 14 Dugri Road, Ludhiana, Punjab)
  return {
    coords: {
      latitude: 30.8893,
      longitude: 75.8490,
    },
    isFallback: true,
  };
}

/**
 * Request permission and get current device GPS position
 */
export async function getCurrentGPS(): Promise<Coordinates> {
  const { coords } = await getCurrentGPSDetailed();
  return coords;
}

/**
 * Map areas. Ludhiana Ward 14 (Dugri Road Corridor, Punjab).
 */
export const WARD_14_LUDHIANA = {
  wardId: 'WARD_LUDHIANA_14',
  shortLabel: 'Ward 14, Ludhiana',
  mapLabel: 'WARD 14 • LUDHIANA GEOSPATIAL RADAR',
  userLabel: 'Ward 14, Ludhiana',
  areaTitle: 'WARD 14 GEOSPATIAL RADAR',
  areaSubtitle: 'Dugri Road Corridor, Ludhiana',
  center: { latitude: 30.8893, longitude: 75.8490 },
  zoom: 15,
} as const;

// Backward-compatibility alias
export const DELHI_WARD_14 = WARD_14_LUDHIANA;

export const LUDHIANA_CASE_STUDY = {
  wardId: 'WARD_LUDHIANA_DUGRI',
  shortLabel: 'Dugri Road, Ludhiana',
  mapLabel: 'LUDHIANA • DUGRI ROAD CASE STUDY',
  userLabel: 'Dugri Road, Ludhiana',
  areaTitle: 'LUDHIANA CASE-STUDY RADAR',
  areaSubtitle: 'Dugri–Gill Road Corridor',
  // Dugri Road corridor from OpenStreetMap (Nominatim): spans roughly
  // (30.8686, 75.8435) → (30.8893, 75.8490); center is the midpoint.
  center: { latitude: 30.8785, longitude: 75.8462 },
  zoom: 14,
} as const;
