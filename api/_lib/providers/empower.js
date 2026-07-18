import { buildFormulaQuote } from '../../../src/shared/fareEstimate.js';
import { RIDE_PROVIDERS } from '../../../src/constants/providers.js';

/**
 * Empower has no public pricing API, documented or unofficial. This always
 * returns the formula estimate — there is no live call to fail over from.
 */
export async function fetchEmpowerQuote(travelStats) {
  return buildFormulaQuote(RIDE_PROVIDERS.empower.id, travelStats, {
    source: 'empower-formula',
  });
}
