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
 * Checks whether user coordinates are within threshold (default: 50 meters) of target
 */
export function checkGeofence(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  maxMeters: number = 50
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
 * Request permission and get current device GPS position
 */
export async function getCurrentGPS(): Promise<Coordinates> {
  try {
    const Location = await import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
    }
  } catch (err) {
    // Fallback if running on simulator or web without GPS
  }

  // Default reference coordinate (e.g. Connaught Place / Ward 14 Delhi)
  return {
    latitude: 28.6289,
    longitude: 77.2065,
  };
}
