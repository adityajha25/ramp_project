import { estimateTravelStats } from '../../src/shared/fareEstimate.js';

const MAPBOX_TOKEN = process.env.VITE_MAPBOX_TOKEN;

/**
 * Real street-routing distance/time from Mapbox Directions, so fare formulas
 * (Empower fallback, NYC Taxi meter) aren't fed straight-line haversine
 * numbers that undercount in a grid city. Falls back to the haversine
 * heuristic if Directions is unavailable or errors.
 */
export async function getRouteStats({ pickup, dropoff }) {
  if (!MAPBOX_TOKEN) {
    return estimateTravelStats(pickup, dropoff);
  }

  try {
    const url = new URL(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}`
    );
    url.searchParams.set('access_token', MAPBOX_TOKEN);
    url.searchParams.set('overview', 'false');

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Directions API returned ${response.status}`);
    }

    const data = await response.json();
    const route = data.routes?.[0];
    if (!route) {
      throw new Error('No route returned');
    }

    return {
      miles: Math.max(route.distance / 1609.34, 0.3),
      minutes: Math.max(route.duration / 60, 5),
    };
  } catch (error) {
    console.error('Directions lookup failed, falling back to haversine:', error.message);
    return estimateTravelStats(pickup, dropoff);
  }
}
