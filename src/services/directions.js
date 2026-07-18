const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

/**
 * Fetch a driving route geometry between two points via Mapbox Directions.
 * Returns GeoJSON LineString coordinates [[lng, lat], ...] or a straight fallback.
 */
export async function fetchDrivingRoute(pickup, dropoff) {
  if (!pickup || !dropoff) {
    return null;
  }

  const fallback = [
    [pickup.lng, pickup.lat],
    [dropoff.lng, dropoff.lat],
  ];

  if (!MAPBOX_TOKEN) {
    return fallback;
  }

  try {
    const url = new URL(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`
    );
    url.searchParams.set('geometries', 'geojson');
    url.searchParams.set('overview', 'full');
    url.searchParams.set('access_token', MAPBOX_TOKEN);

    const response = await fetch(url);
    if (!response.ok) {
      return fallback;
    }

    const data = await response.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates;
    return coords?.length ? coords : fallback;
  } catch {
    return fallback;
  }
}
