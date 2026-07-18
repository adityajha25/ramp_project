import { RIDE_PROVIDERS } from '../constants/providers.js';
import { distanceInMiles } from '../utils/formatters.js';

/**
 * MVP pricing engine.
 *
 * Real Uber/Lyft/Empower price APIs require partner credentials and server-side
 * auth. This boilerplate estimates fares from distance + NYC taxi meter rules
 * so the UI can be wired end-to-end before live API integration.
 *
 * TODO: Replace estimateProviderQuotes() bodies with authenticated API calls.
 */

const PROVIDER_RATE_TABLE = {
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

function estimateTravelStats(pickup, dropoff) {
  const miles = Math.max(distanceInMiles(pickup, dropoff), 0.3);
  const averageSpeedMph = 14;
  const minutes = Math.max((miles / averageSpeedMph) * 60, 5);

  return { miles, minutes };
}

function estimateFare(providerId, travelStats) {
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

function buildQuote(providerId, pickup, dropoff, travelStats) {
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
  };
}

/**
 * Fetch comparable quotes for all supported providers.
 */
export async function fetchRideQuotes({ pickup, dropoff }) {
  // Simulate network latency for realistic UI states.
  await new Promise((resolve) => window.setTimeout(resolve, 450));

  const travelStats = estimateTravelStats(pickup, dropoff);

  return Object.values(RIDE_PROVIDERS).map((provider) =>
    buildQuote(provider.id, pickup, dropoff, travelStats)
  );
}

/**
 * Rank quotes by the selected optimization mode.
 */
export function sortQuotes(quotes, sortMode = 'cheapest') {
  const sorted = [...quotes];

  switch (sortMode) {
    case 'fastest':
      return sorted.sort((a, b) => a.etaMinutes - b.etaMinutes);
    case 'bestValue':
      return sorted.sort(
        (a, b) => a.priceLow / Math.max(a.etaMinutes, 1) - b.priceLow / Math.max(b.etaMinutes, 1)
      );
    case 'cheapest':
    default:
      return sorted.sort((a, b) => a.priceLow - b.priceLow);
  }
}

/**
 * Placeholder stubs for future live API integrations.
 */
export const rideApiStubs = {
  uber: {
    status: 'not-configured',
    note: 'Requires Uber Developer credentials + server-side OAuth.',
  },
  lyft: {
    status: 'not-configured',
    note: 'Requires Lyft Developer Program access.',
  },
  empower: {
    status: 'not-configured',
    note: 'No public pricing API documented; partner integration TBD.',
  },
  nycTaxi: {
    status: 'public-data',
    note: 'Use NYC TLC trip record aggregates + meter formula until live dispatch API is added.',
  },
};
