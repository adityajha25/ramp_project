import { RIDE_PROVIDERS } from '../constants/providers.js';
import { distanceInMiles } from '../utils/formatters.js';

/**
 * MVP pricing engine with distance-based math and per-provider randomness.
 *
 * Real Uber/Lyft/Empower price APIs require partner credentials and server-side
 * auth. Until then, this simulates realistic fare spread on each compare.
 *
 * TODO: Replace fetchRideQuotes() with authenticated API calls.
 */

const PROVIDER_RATE_TABLE = {
  [RIDE_PROVIDERS.uber.id]: {
    baseFare: 2.55,
    perMile: 2.15,
    perMinute: 0.35,
    bookingFee: 2.5,
    surgeMin: 1.0,
    surgeMax: 2.4,
    etaVarianceMinutes: 4,
    priceJitter: 0.08,
  },
  [RIDE_PROVIDERS.lyft.id]: {
    baseFare: 2.0,
    perMile: 2.05,
    perMinute: 0.32,
    bookingFee: 2.25,
    surgeMin: 1.0,
    surgeMax: 2.2,
    etaVarianceMinutes: 5,
    priceJitter: 0.07,
  },
  [RIDE_PROVIDERS.empower.id]: {
    baseFare: 1.75,
    perMile: 1.85,
    perMinute: 0.28,
    bookingFee: 1.5,
    surgeMin: 1.0,
    surgeMax: 1.15,
    etaVarianceMinutes: 7,
    priceJitter: 0.05,
  },
  [RIDE_PROVIDERS.nycTaxi.id]: {
    baseFare: 3.0,
    perMile: 2.5,
    perMinute: 0.5,
    bookingFee: 0,
    surgeMin: 1.0,
    surgeMax: 1.0,
    etaVarianceMinutes: 3,
    priceJitter: 0.04,
  },
};

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function roundMoney(value) {
  return Number(value.toFixed(2));
}

function getTrafficMultiplier() {
  const hour = new Date().getHours();
  const isWeekday = new Date().getDay() >= 1 && new Date().getDay() <= 5;

  if (isWeekday && hour >= 7 && hour <= 9) {
    return randomBetween(1.08, 1.22);
  }

  if (isWeekday && hour >= 16 && hour <= 19) {
    return randomBetween(1.1, 1.28);
  }

  if (hour >= 22 || hour <= 5) {
    return randomBetween(0.95, 1.05);
  }

  return randomBetween(0.98, 1.08);
}

function estimateTravelStats(pickup, dropoff) {
  const miles = Math.max(distanceInMiles(pickup, dropoff), 0.3);
  const trafficMultiplier = getTrafficMultiplier();
  const averageSpeedMph = Math.max(11 / trafficMultiplier, 8);
  const minutes = Math.max((miles / averageSpeedMph) * 60 * trafficMultiplier, 5);

  return { miles, minutes, trafficMultiplier };
}

function getNycTaxiSurcharges() {
  const hour = new Date().getHours();
  const isWeekday = new Date().getDay() >= 1 && new Date().getDay() <= 5;

  let surcharges = 1.0; // improvement surcharge
  surcharges += randomBetween(0, 1) > 0.35 ? 1.0 : 0; // congestion surcharge (rough)
  surcharges += hour >= 20 || hour < 6 ? 1.0 : 0; // overnight
  surcharges += isWeekday && hour >= 16 && hour < 20 ? 2.5 : 0; // rush hour

  return surcharges;
}

function estimateSurgeMultiplier(providerId, rates) {
  if (providerId === RIDE_PROVIDERS.nycTaxi.id) {
    return 1;
  }

  const roll = Math.random();

  if (roll < 0.55) {
    return 1;
  }

  if (roll < 0.82) {
    return roundMoney(randomBetween(1.05, 1.35));
  }

  return roundMoney(randomBetween(rates.surgeMin, rates.surgeMax));
}

function estimateFare(providerId, travelStats) {
  const rates = PROVIDER_RATE_TABLE[providerId];
  const surgeMultiplier = estimateSurgeMultiplier(providerId, rates);
  const jitter = 1 + randomBetween(-rates.priceJitter, rates.priceJitter);

  const distanceComponent = travelStats.miles * rates.perMile * randomBetween(0.96, 1.04);
  const timeComponent = travelStats.minutes * rates.perMinute * randomBetween(0.94, 1.06);

  let raw =
    rates.baseFare +
    distanceComponent +
    timeComponent +
    rates.bookingFee;

  if (providerId === RIDE_PROVIDERS.nycTaxi.id) {
    raw += getNycTaxiSurcharges();
  }

  const total = raw * surgeMultiplier * jitter * travelStats.trafficMultiplier;
  const spread = randomBetween(0.06, 0.14);

  const low = Math.max(total * (1 - spread), rates.baseFare);
  const high = total * (1 + spread * randomBetween(0.8, 1.2));

  const etaOffset = randomInt(-rates.etaVarianceMinutes, rates.etaVarianceMinutes);
  const etaMinutes = Math.max(Math.round(travelStats.minutes + etaOffset), 3);

  return {
    low: roundMoney(low),
    high: roundMoney(Math.max(high, low + 1.5)),
    etaMinutes,
    surgeMultiplier,
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
    priceLow: fare.low,
    priceHigh: fare.high,
    currency: 'USD',
    surgeMultiplier: fare.surgeMultiplier,
    isEstimate: true,
    source: 'simulated-estimate',
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
