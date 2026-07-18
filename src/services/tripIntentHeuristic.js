/**
 * Keyword/pattern trip parser used when OpenAI is unavailable.
 */

const PLACE_ALIASES = [
  { pattern: /\bjfk\b|\bj\.?f\.?k\.?\s*airport\b/i, query: 'JFK Airport, Queens' },
  { pattern: /\blga\b|\blaguardia\b|\blagardia\b/i, query: 'LaGuardia Airport, Queens' },
  { pattern: /\bewr\b|\bnewark\s*(airport)?\b/i, query: 'Newark Liberty International Airport' },
  { pattern: /\btimes\s*square\b/i, query: 'Times Square, Manhattan' },
  { pattern: /\bsoho\b/i, query: 'SoHo, Manhattan' },
  { pattern: /\bwilliamsburg\b/i, query: 'Williamsburg, Brooklyn' },
  { pattern: /\bcentral\s*park\b/i, query: 'Central Park, Manhattan' },
  { pattern: /\bbrooklyn\s*bridge\b/i, query: 'Brooklyn Bridge, New York' },
  { pattern: /\bgrand\s*central\b/i, query: 'Grand Central Terminal, Manhattan' },
  { pattern: /\bpenn\s*station\b/i, query: 'Penn Station, Manhattan' },
];

function normalizePreference(text) {
  const lower = text.toLowerCase();
  if (/\b(cheap|cheapest|lowest|budget|inexpensive)\b/.test(lower)) {
    return 'cheapest';
  }
  if (/\b(fast|fastest|quick|quickest|soonest|time[- ]?effective)\b/.test(lower)) {
    return 'fastest';
  }
  return 'bestValue';
}

function parseArriveBy(text, now = new Date()) {
  const lower = text.toLowerCase();
  const match =
    lower.match(/\b(?:by|before|at)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/) ||
    lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);

  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3];

  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  if (!meridiem && hour <= 12 && hour >= 1) {
    // Bare "by 6" in evening contexts → assume PM if afternoon/evening now, else keep.
    if (now.getHours() >= 12 && hour < 12) hour += 12;
  }

  const arrive = new Date(now);
  arrive.setSeconds(0, 0);
  arrive.setHours(hour, minute, 0, 0);

  if (arrive.getTime() <= now.getTime()) {
    arrive.setDate(arrive.getDate() + 1);
  }

  return arrive.toISOString();
}

function resolveAlias(text) {
  for (const alias of PLACE_ALIASES) {
    if (alias.pattern.test(text)) {
      return alias.query;
    }
  }
  return null;
}

function cleanPlaceFragment(fragment) {
  return fragment
    .replace(
      /\b(by|before|at)\s+\d{1,2}(?::\d{2})?\s*(am|pm)?\b/gi,
      ''
    )
    .replace(/\b(cheapest|cheap|fastest|fast|best\s*value|optimal|option|options|please|asap)\b/gi, '')
    .replace(/[,.]+$/g, '')
    .trim();
}

/**
 * Parse a free-text trip request without an LLM.
 * @param {string} prompt
 * @param {string} [nowIso]
 */
export function parseTripHeuristic(prompt, nowIso) {
  const text = String(prompt || '').trim();
  if (!text) {
    throw new Error('Describe where you want to go.');
  }

  const now = nowIso ? new Date(nowIso) : new Date();
  const preference = normalizePreference(text);
  const arriveBy = parseArriveBy(text, now);

  let pickupQuery = null;
  let dropoffQuery = null;

  const fromTo = text.match(/\bfrom\s+(.+?)\s+to\s+(.+)$/i);
  if (fromTo) {
    pickupQuery = resolveAlias(fromTo[1]) || cleanPlaceFragment(fromTo[1]) || null;
    dropoffQuery = resolveAlias(fromTo[2]) || cleanPlaceFragment(fromTo[2]);
  } else {
    const toMatch = text.match(
      /\b(?:get\s+me\s+to|take\s+me\s+to|go\s+to|to|towards?)\s+(.+)$/i
    );
    const destRaw = toMatch ? toMatch[1] : text;
    dropoffQuery = resolveAlias(destRaw) || cleanPlaceFragment(destRaw);
  }

  if (!dropoffQuery) {
    throw new Error('Could not determine a destination. Try “get me to JFK by 6pm”.');
  }

  return {
    pickupQuery,
    dropoffQuery,
    arriveBy,
    preference,
    source: 'heuristic',
  };
}
