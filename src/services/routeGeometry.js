const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const WALK_COLOR = '#6b7280';

/**
 * Street-following geometry for a leg via Mapbox Directions.
 * Falls back to a straight line if the request fails.
 */
async function fetchDirectionsGeometry(profile, from, to) {
  try {
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/` +
      `${from.lng},${from.lat};${to.lng},${to.lat}` +
      `?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const coordinates = data.routes?.[0]?.geometry?.coordinates;
      if (coordinates?.length > 1) {
        return coordinates;
      }
    }
  } catch {
    // fall through to straight line
  }

  return [
    [from.lng, from.lat],
    [to.lng, to.lat],
  ];
}

function lineFeature(coordinates, color, dashed = false) {
  return {
    type: 'Feature',
    properties: { color, dashed },
    geometry: { type: 'LineString', coordinates },
  };
}

/**
 * Direct door-to-door driving route (cab / rideshare / own car).
 */
export async function buildDirectRideGeoJson(pickup, dropoff, color = '#0f172a') {
  const coordinates = await fetchDirectionsGeometry('driving', pickup, dropoff);
  return {
    type: 'FeatureCollection',
    features: [lineFeature(coordinates, color)],
  };
}

/**
 * Multi-leg smart itinerary: dashed gray walks, brand-colored ride legs,
 * MTA line colors for each subway segment.
 */
export async function buildItineraryGeoJson(itinerary) {
  const features = [];

  for (const leg of itinerary.legs) {
    if (leg.mode === 'walk') {
      const coordinates = await fetchDirectionsGeometry('walking', leg.fromPoint, leg.toPoint);
      features.push(lineFeature(coordinates, WALK_COLOR, true));
    } else if (leg.mode === 'ride') {
      const coordinates = await fetchDirectionsGeometry('driving', leg.fromPoint, leg.toPoint);
      features.push(lineFeature(coordinates, leg.brandColor));
    } else {
      for (const segment of leg.segments) {
        features.push(lineFeature(segment.coordinates, segment.color));
      }
    }
  }

  return { type: 'FeatureCollection', features };
}
