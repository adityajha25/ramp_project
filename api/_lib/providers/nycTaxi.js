import { RIDE_PROVIDERS } from '../../../src/constants/providers.js';

const INITIAL_CHARGE = 3.0;
const PER_MILE = 3.5; // $0.70 per 1/5 mile
const PER_MINUTE = 0.7; // $0.70 per 60s stopped/slow traffic
const NIGHT_SURCHARGE = 1.0; // 8pm-6am
const PEAK_WEEKDAY_SURCHARGE = 2.5; // Mon-Fri 4pm-8pm
const NY_STATE_SURCHARGE = 0.5;
const CONGESTION_SURCHARGE = 2.5; // applied flat for MVP; real rule is zone-gated (Manhattan south of 96th St)

function isNightHours(date) {
  const hour = date.getHours();
  return hour >= 20 || hour < 6;
}

function isPeakWeekdayHours(date) {
  const day = date.getDay();
  const hour = date.getHours();
  return day >= 1 && day <= 5 && hour >= 16 && hour < 20;
}

/**
 * Real, published NYC TLC yellow-cab meter formula — deterministic, not a
 * guess. The per-minute component approximates the meter's stopped/slow-
 * traffic charge using total trip minutes, since we don't have real-time
 * speed data; this can slightly overstate the fare vs. a real in-cab meter.
 */
export async function fetchNycTaxiQuote(travelStats, { requestTime = new Date() } = {}) {
  const provider = RIDE_PROVIDERS.nycTaxi;

  let total = INITIAL_CHARGE + travelStats.miles * PER_MILE + travelStats.minutes * PER_MINUTE;

  if (isNightHours(requestTime)) total += NIGHT_SURCHARGE;
  if (isPeakWeekdayHours(requestTime)) total += PEAK_WEEKDAY_SURCHARGE;
  total += NY_STATE_SURCHARGE;
  total += CONGESTION_SURCHARGE;

  return {
    providerId: provider.id,
    providerName: provider.name,
    brandColor: provider.brandColor,
    accentColor: provider.accentColor,
    etaMinutes: Math.round(travelStats.minutes),
    priceLow: Number((total * 0.97).toFixed(2)),
    priceHigh: Number((total * 1.05).toFixed(2)),
    currency: 'USD',
    isEstimate: false,
    source: 'tlc-meter-formula',
  };
}
