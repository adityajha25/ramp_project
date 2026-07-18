import { parseTripHeuristic } from './tripIntentHeuristic.js';

/**
 * Parse trip intent via OpenAI API, falling back to heuristic parsing.
 * @param {string} prompt
 */
export async function parseTripIntent(prompt) {
  const trimmed = String(prompt || '').trim();
  if (!trimmed) {
    throw new Error('Describe where you want to go.');
  }

  const nowIso = new Date().toISOString();

  try {
    const response = await fetch('/api/parse-trip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: trimmed, nowIso }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.dropoffQuery) {
        return {
          pickupQuery: data.pickupQuery ?? null,
          dropoffQuery: data.dropoffQuery,
          arriveBy: data.arriveBy ?? null,
          preference: data.preference || 'bestValue',
          source: data.source || 'openai',
        };
      }
    }
  } catch {
    // Network / middleware unavailable — fall through to heuristic.
  }

  return parseTripHeuristic(trimmed, nowIso);
}
