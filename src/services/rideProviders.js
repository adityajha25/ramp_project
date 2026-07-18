import { RIDE_PROVIDERS, PERSONAL_CAR } from '../constants/providers.js';
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
    minFare: 9,
    surgeMin: 1.0,
    surgeMax: 1.8,
    etaVarianceMinutes: 4,
    priceJitter: 0.08,
    tiers: [
      { id: 'uberx', name: 'UberX', multiplier: 1, note: 'Affordable everyday rides' },
      {
        id: 'shuttle',
        name: 'Uber Shuttle',
        multiplier: 0.4,
        etaExtraMinutes: 14,
        note: 'Shared shuttle, per seat · fixed pickup times',
      },
      { id: 'comfort', name: 'Uber Comfort', multiplier: 1.22, note: 'Newer cars, extra legroom' },
      { id: 'uberxl', name: 'UberXL', multiplier: 1.5, note: 'SUVs and vans, up to 6 riders' },
      { id: 'black', name: 'Uber Black', multiplier: 2.15, note: 'Luxury cars, professional drivers' },
    ],
  },
  [RIDE_PROVIDERS.lyft.id]: {
    baseFare: 2.0,
    perMile: 2.05,
    perMinute: 0.32,
    bookingFee: 2.25,
    minFare: 8.5,
    surgeMin: 1.0,
    surgeMax: 1.75,
    etaVarianceMinutes: 5,
    priceJitter: 0.07,
    tiers: [
      { id: 'lyft', name: 'Lyft', multiplier: 1, note: 'Standard ride' },
      { id: 'comfort', name: 'Extra Comfort', multiplier: 1.25, note: 'Newer cars, top drivers' },
      { id: 'lyftxl', name: 'Lyft XL', multiplier: 1.55, note: 'SUVs, up to 6 riders' },
      { id: 'black', name: 'Lyft Black', multiplier: 2.05, note: 'Premium black car service' },
    ],
  },
  [RIDE_PROVIDERS.empower.id]: {
    baseFare: 1.75,
    perMile: 1.85,
    perMinute: 0.28,
    bookingFee: 1.5,
    minFare: 7,
    surgeMin: 1.0,
    surgeMax: 1.15,
    etaVarianceMinutes: 7,
    priceJitter: 0.05,
    tiers: [
      { id: 'standard', name: 'Empower', multiplier: 1, note: 'Drivers keep 100% of the fare' },
      { id: 'premium', name: 'Empower Premium', multiplier: 1.35, note: 'Top-rated drivers, nicer cars' },
    ],
  },
  [RIDE_PROVIDERS.nycTaxi.id]: {
    baseFare: 3.0,
    perMile: 2.5,
    perMinute: 0.5,
    bookingFee: 0,
    minFare: 8,
    surgeMin: 1.0,
    surgeMax: 1.0,
    etaVarianceMinutes: 3,
    priceJitter: 0.04,
    tiers: [{ id: 'yellow', name: 'Yellow Cab', multiplier: 1, note: 'Metered TLC fare' }],
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

  // Short hops crawl through surface streets; longer trips pick up highway
  // speed. ~10 mph in the core, up to ~22 mph for cross-borough runs.
  const baseSpeedMph = Math.min(10 + miles * 0.9, 22);
  const averageSpeedMph = Math.max(baseSpeedMph / trafficMultiplier, 8);
  const minutes = Math.max((miles / averageSpeedMph) * 60, 5);

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
  const spread = randomBetween(0.05, 0.1);

  const low = Math.max(total * (1 - spread), rates.minFare ?? rates.baseFare);
  // Keep the range tight so estimates look like real app quotes.
  const high = Math.min(total * (1 + spread), low * 1.25);

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
  const rates = PROVIDER_RATE_TABLE[providerId];
  const fare = estimateFare(providerId, travelStats);

  // Tiers scale off the standard fare estimate; shared products (shuttle)
  // are cheaper but add schedule wait to the ETA.
  const tiers = rates.tiers.map((tier) => ({
    id: tier.id,
    name: tier.name,
    note: tier.note,
    priceLow: roundMoney(fare.low * tier.multiplier),
    priceHigh: roundMoney(fare.high * tier.multiplier),
    etaMinutes: fare.etaMinutes + (tier.etaExtraMinutes ?? 0),
  }));

  return {
    providerId,
    providerName: provider.name,
    brandColor: provider.brandColor,
    accentColor: provider.accentColor,
    etaMinutes: fare.etaMinutes,
    priceLow: tiers[0].priceLow,
    priceHigh: tiers[0].priceHigh,
    tiers,
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
 * Personal car cost model: gas + wear + estimated parking at the destination.
 */
const OWN_CAR = {
  mpg: 24,
  gasPerGallon: 3.1,
  wearPerMile: 0.12,
  parkSearchMinutes: [4, 12],
};

function estimateParking(dropoff) {
  const inManhattanCore =
    dropoff.lat > 40.7 && dropoff.lat < 40.79 && dropoff.lng > -74.02 && dropoff.lng < -73.93;

  if (inManhattanCore) {
    return { low: 18, high: 45, label: 'Manhattan garage' };
  }
  return { low: 0, high: 12, label: 'street/garage' };
}

export function estimatePersonalCarQuote(pickup, dropoff) {
  const travelStats = estimateTravelStats(pickup, dropoff);
  const fuel = (travelStats.miles / OWN_CAR.mpg) * OWN_CAR.gasPerGallon;
  const wear = travelStats.miles * OWN_CAR.wearPerMile;
  const parking = estimateParking(dropoff);
  const parkSearch = randomBetween(OWN_CAR.parkSearchMinutes[0], OWN_CAR.parkSearchMinutes[1]);

  return {
    providerId: PERSONAL_CAR.id,
    providerName: PERSONAL_CAR.name,
    brandColor: PERSONAL_CAR.brandColor,
    accentColor: PERSONAL_CAR.accentColor,
    etaMinutes: Math.round(travelStats.minutes + parkSearch),
    priceLow: roundMoney(fuel + wear + parking.low),
    priceHigh: roundMoney((fuel + wear) * 1.1 + parking.high),
    currency: 'USD',
    surgeMultiplier: 1,
    isEstimate: true,
    note: `Gas + wear + ${parking.label} parking`,
    source: 'own-car-estimate',
  };
}

/**
 * Estimate the cheapest private option for a single (usually short) leg.
 * Used by the hybrid composer to price first/last-mile rideshare hops.
 */
export function estimateCheapestPrivateLeg(pickup, dropoff) {
  const travelStats = estimateTravelStats(pickup, dropoff);

  const quotes = Object.values(RIDE_PROVIDERS)
    .filter((provider) => provider.id !== RIDE_PROVIDERS.nycTaxi.id)
    .map((provider) => buildQuote(provider.id, pickup, dropoff, travelStats));

  return quotes.sort((a, b) => a.priceLow - b.priceLow)[0];
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
