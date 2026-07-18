/**
 * Curated NYC landmarks — matched before/alongside Mapbox geocoding so
 * "jfk", "empire state", and "bronx zoo" resolve to the right place.
 */
export const NYC_LANDMARKS = [
  {
    id: 'jfk',
    name: 'JFK Airport',
    label: 'JFK Airport, Queens',
    lat: 40.6413,
    lng: -73.7781,
    aliases: ['jfk', 'jfk airport', 'kennedy', 'john f kennedy', 'john f kennedy airport'],
  },
  {
    id: 'lga',
    name: 'LaGuardia Airport',
    label: 'LaGuardia Airport, Queens',
    lat: 40.7769,
    lng: -73.874,
    aliases: ['lga', 'laguardia', 'la guardia', 'la guardia airport'],
  },
  {
    id: 'ewr',
    name: 'Newark Airport',
    label: 'Newark Liberty Airport, NJ',
    lat: 40.6895,
    lng: -74.1745,
    aliases: ['ewr', 'newark airport', 'newark liberty'],
  },
  {
    id: 'empire-state',
    name: 'Empire State Building',
    label: 'Empire State Building, Manhattan',
    lat: 40.7484,
    lng: -73.9857,
    aliases: ['empire state', 'empire state building', 'empire state bldg', 'esb'],
  },
  {
    id: 'times-square',
    name: 'Times Square',
    label: 'Times Square, Manhattan',
    lat: 40.758,
    lng: -73.9855,
    aliases: ['times square', 'times sq', 'tsq'],
  },
  {
    id: 'bronx-zoo',
    name: 'Bronx Zoo',
    label: 'Bronx Zoo, Bronx',
    lat: 40.8506,
    lng: -73.875,
    aliases: ['bronx zoo', 'the bronx zoo'],
  },
  {
    id: 'central-park',
    name: 'Central Park',
    label: 'Central Park, Manhattan',
    lat: 40.7829,
    lng: -73.9654,
    aliases: ['central park', 'the park'],
  },
  {
    id: 'statue-liberty',
    name: 'Statue of Liberty',
    label: 'Statue of Liberty, Manhattan',
    lat: 40.6892,
    lng: -74.0445,
    aliases: ['statue of liberty', 'liberty island', 'statue liberty'],
  },
  {
    id: 'rockefeller',
    name: 'Rockefeller Center',
    label: 'Rockefeller Center, Manhattan',
    lat: 40.7587,
    lng: -73.9787,
    aliases: ['rockefeller center', 'rock center', 'rockefeller', '30 rock'],
  },
  {
    id: 'barclays',
    name: 'Barclays Center',
    label: 'Barclays Center, Brooklyn',
    lat: 40.6826,
    lng: -73.9754,
    aliases: ['barclays', 'barclays center', 'barclays centre'],
  },
  {
    id: 'yankee-stadium',
    name: 'Yankee Stadium',
    label: 'Yankee Stadium, Bronx',
    lat: 40.8296,
    lng: -73.9262,
    aliases: ['yankee stadium', 'yankees', 'the stadium'],
  },
  {
    id: 'citi-field',
    name: 'Citi Field',
    label: 'Citi Field, Queens',
    lat: 40.7571,
    lng: -73.8458,
    aliases: ['citi field', 'mets', 'mets stadium'],
  },
  {
    id: 'madison-square-garden',
    name: 'Madison Square Garden',
    label: 'Madison Square Garden, Manhattan',
    lat: 40.7505,
    lng: -73.9934,
    aliases: ['msg', 'madison square garden', 'the garden'],
  },
  {
    id: 'grand-central',
    name: 'Grand Central Terminal',
    label: 'Grand Central Terminal, Manhattan',
    lat: 40.7527,
    lng: -73.9772,
    aliases: ['grand central', 'gct', 'grand central terminal', 'grand central station'],
  },
  {
    id: 'penn-station',
    name: 'Penn Station',
    label: 'Penn Station, Manhattan',
    lat: 40.7506,
    lng: -73.9935,
    aliases: ['penn station', 'pennsylvania station', 'ny penn'],
  },
  {
    id: 'world-trade',
    name: 'One World Trade Center',
    label: 'World Trade Center, Manhattan',
    lat: 40.7127,
    lng: -74.0134,
    aliases: ['wtc', 'world trade center', 'freedom tower', 'one world trade'],
  },
  {
    id: 'brooklyn-bridge',
    name: 'Brooklyn Bridge',
    label: 'Brooklyn Bridge, Manhattan',
    lat: 40.7061,
    lng: -73.9969,
    aliases: ['brooklyn bridge'],
  },
  {
    id: 'coney-island',
    name: 'Coney Island',
    label: 'Coney Island, Brooklyn',
    lat: 40.5755,
    lng: -73.9707,
    aliases: ['coney island', 'coney'],
  },
  {
    id: 'flushing',
    name: 'Flushing–Main St',
    label: 'Flushing–Main St, Queens',
    lat: 40.7596,
    lng: -73.8303,
    aliases: ['flushing', 'flushing main st', 'chinatown flushing'],
  },
];

function normalizeQuery(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Returns true when the query exactly matches a landmark name or alias.
 */
export function isExactLandmarkQuery(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return false;
  }

  return NYC_LANDMARKS.some(
    (landmark) =>
      normalizeQuery(landmark.name) === normalized ||
      landmark.aliases.some((alias) => alias === normalized)
  );
}

/**
 * Returns landmark matches for a search query, best match first.
 */
export function matchLandmarks(query, { limit = 3 } = {}) {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return [];
  }

  const scored = NYC_LANDMARKS.map((landmark) => {
    let score = 0;

    for (const alias of landmark.aliases) {
      if (normalized === alias) {
        score = Math.max(score, 100);
      } else if (alias.startsWith(normalized) || normalized.startsWith(alias)) {
        score = Math.max(score, 80);
      } else if (normalized.includes(alias) || alias.includes(normalized)) {
        score = Math.max(score, 60);
      }
    }

    if (landmark.name.toLowerCase().includes(normalized)) {
      score = Math.max(score, 50);
    }

    return { landmark, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ landmark }) => ({
    id: `landmark:${landmark.id}`,
    label: landmark.label,
    shortLabel: landmark.name,
    lat: landmark.lat,
    lng: landmark.lng,
    kind: 'landmark',
  }));
}
