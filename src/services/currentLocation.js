import { reverseGeocode } from './geocoding.js';
import { isWithinNYCServiceArea, DEMO_ROUTES } from '../constants/nyc.js';

const DEMO_PICKUP = {
  lat: DEMO_ROUTES[0].pickup.lat,
  lng: DEMO_ROUTES[0].pickup.lng,
  label: 'Current location (demo) — Times Square',
};

/**
 * Resolve the user's GPS position as a pickup place.
 * Falls back to a Times Square demo pin if permission is denied or outside NYC.
 */
export async function getCurrentPickup() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return { ...DEMO_PICKUP, isDemo: true };
  }

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60_000,
      });
    });

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    if (!isWithinNYCServiceArea({ lat, lng })) {
      return { ...DEMO_PICKUP, isDemo: true };
    }

    const placeName = await reverseGeocode({ lat, lng });
    return {
      lat,
      lng,
      label: `Current location — ${placeName}`,
      isDemo: false,
    };
  } catch {
    return { ...DEMO_PICKUP, isDemo: true };
  }
}
