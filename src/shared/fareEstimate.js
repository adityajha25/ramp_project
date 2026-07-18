import { RIDE_PROVIDERS } from '../constants/providers.js';
import { distanceInMiles } from '../utils/formatters.js';

/**
 * Fallback fare formula, shared between the frontend and the api/ serverless
 * functions so there is one source of truth. Used whenever a provider has no
 * live pricing source (Empower) or its live call failed/timed out.
 */
export const PROVIDER_RATE_TABLE = {
  [RIDE_PROVIDERS.uber.id]: {
    baseFare: 2.55,
    perMile: 2.15,
    perMinute: 0.35,
    bookingFee: 2.5,
    surgeMultiplier: 1.05,
  },
  [RIDE_PROVIDERS.lyft.id]: {
    baseFare: 2.0,
    perMile: 2.05,
    perMinute: 0.32,
    bookingFee: 2.25,
    surgeMultiplier: 1.08,
  },
  [RIDE_PROVIDERS.empower.id]: {
    baseFare: 1.75,
    perMile: 1.85,
    perMinute: 0.28,
    bookingFee: 1.5,
    surgeMultiplier: 1.0,
  },
  [RIDE_PROVIDERS.nycTaxi.id]: {
    baseFare: 3.0,
    perMile: 2.5,
    perMinute: 0.5,
    bookingFee: 0,
    surgeMultiplier: 1.0,
  },
};

/**
 * Straight-line distance/time estimate. Used only when real routing
 * (Mapbox Directions) is unavailable.
 */
export function estimateTravelStats(pickup, dropoff) {
  const miles = Math.max(distanceInMiles(pickup, dropoff), 0.3);
  const averageSpeedMph = 14;
  const minutes = Math.max((miles / averageSpeedMph) * 60, 5);

  return { miles, minutes };
}

export function estimateFare(providerId, travelStats) {
  const rates = PROVIDER_RATE_TABLE[providerId];
  const raw =
    rates.baseFare +
    travelStats.miles * rates.perMile +
    travelStats.minutes * rates.perMinute +
    rates.bookingFee;

  const total = raw * rates.surgeMultiplier;

  return {
    low: Math.max(total * 0.92, rates.baseFare),
    high: total * 1.12,
    etaMinutes: Math.round(travelStats.minutes),
  };
}

/**
 * Builds a quote from the formula fallback. Defaults to the
 * fallback-due-to-failure source; callers can override for providers that
 * are formula-based by design (e.g. Empower has no live API at all).
 */
export function buildFormulaQuote(providerId, travelStats, overrides = {}) {
  const provider = Object.values(RIDE_PROVIDERS).find((item) => item.id === providerId);
  const fare = estimateFare(providerId, travelStats);

  return {
    providerId,
    providerName: provider.name,
    brandColor: provider.brandColor,
    accentColor: provider.accentColor,
    etaMinutes: fare.etaMinutes,
    priceLow: Number(fare.low.toFixed(2)),
    priceHigh: Number(fare.high.toFixed(2)),
    currency: 'USD',
    isEstimate: true,
    source: 'boilerplate-estimate',
    ...overrides,
  };
}
