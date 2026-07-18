import { RIDE_PROVIDERS } from '../constants/providers.js';

/**
 * Deep links and fallbacks to open each provider app or website.
 * Coordinates use decimal degrees.
 */
export function buildProviderDeepLink(providerId, { pickup, dropoff }) {
  const pickupLat = pickup.lat;
  const pickupLng = pickup.lng;
  const dropoffLat = dropoff.lat;
  const dropoffLng = dropoff.lng;
  const pickupLabel = encodeURIComponent(pickup.label || 'Pickup');
  const dropoffLabel = encodeURIComponent(dropoff.label || 'Dropoff');

  switch (providerId) {
    case RIDE_PROVIDERS.uber.id:
      return {
        appUrl: `uber://?action=setPickup&pickup[latitude]=${pickupLat}&pickup[longitude]=${pickupLng}&pickup[nickname]=${pickupLabel}&dropoff[latitude]=${dropoffLat}&dropoff[longitude]=${dropoffLng}&dropoff[nickname]=${dropoffLabel}`,
        webUrl: `https://m.uber.com/looking?pickup=${pickupLat},${pickupLng}&drop[0]=${dropoffLat},${dropoffLng}`,
      };

    case RIDE_PROVIDERS.lyft.id:
      return {
        appUrl: `lyft://ridetype?id=lyft&pickup[latitude]=${pickupLat}&pickup[longitude]=${pickupLng}&destination[latitude]=${dropoffLat}&destination[longitude]=${dropoffLng}`,
        webUrl: `https://ride.lyft.com/?pickup=${pickupLat},${pickupLng}&destination=${dropoffLat},${dropoffLng}`,
      };

    case RIDE_PROVIDERS.empower.id:
      return {
        // Empower does not publish a documented universal deep link; use app store fallback.
        appUrl: 'https://apps.apple.com/us/app/empower-rideshare/id6445904875',
        webUrl: 'https://www.goempower.com/',
      };

    case RIDE_PROVIDERS.nycTaxi.id:
      return {
        appUrl: `curb://book?pickup_latitude=${pickupLat}&pickup_longitude=${pickupLng}&destination_latitude=${dropoffLat}&destination_longitude=${dropoffLng}`,
        webUrl: 'https://gocurb.com/',
      };

    default:
      return { appUrl: '#', webUrl: '#' };
  }
}

/**
 * Attempts to open the native app, then falls back to the web URL.
 */
export function openProviderBooking(providerId, route) {
  const { appUrl, webUrl } = buildProviderDeepLink(providerId, route);

  const fallbackTimer = window.setTimeout(() => {
    window.open(webUrl, '_blank', 'noopener,noreferrer');
  }, 1200);

  window.location.href = appUrl;

  window.addEventListener(
    'blur',
    () => {
      window.clearTimeout(fallbackTimer);
    },
    { once: true }
  );
}
