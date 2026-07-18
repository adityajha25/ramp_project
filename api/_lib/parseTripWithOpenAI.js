/**
 * Shared OpenAI trip-intent parsing for Vercel and Vite dev middleware.
 */

const SYSTEM_PROMPT = `You extract NYC ride-booking intent from a plain-English request.
Return ONLY valid JSON with this exact shape:
{
  "pickupQuery": string | null,
  "dropoffQuery": string,
  "arriveBy": string | null,
  "preference": "cheapest" | "fastest" | "bestValue"
}

Rules:
- dropoffQuery is required: a place name suitable for Mapbox geocoding in NYC (e.g. "JFK Airport", "SoHo Manhattan").
- pickupQuery is null unless the user names a starting place (e.g. "from Times Square to JFK").
- arriveBy is an ISO 8601 datetime in America/New_York if the user gives a deadline ("by 6pm", "before 8"), else null. Use the provided "now" as the reference day.
- preference: cheapest for cost, fastest for time, bestValue when unclear or for "best"/"optimal".
- Expand common aliases: JFK, LGA, EWR, Times Square, etc.
- Do not include markdown or commentary.`;

function normalizePreference(value) {
  const raw = String(value || '').toLowerCase();
  if (raw === 'cheapest' || raw === 'lowest' || raw === 'cheap') return 'cheapest';
  if (raw === 'fastest' || raw === 'fast' || raw === 'quickest') return 'fastest';
  return 'bestValue';
}

function normalizeIntent(parsed) {
  const dropoffQuery = String(parsed?.dropoffQuery || '').trim();
  if (!dropoffQuery) {
    throw new Error('Could not determine a destination from your request.');
  }

  const pickupRaw = parsed?.pickupQuery;
  const pickupQuery =
    pickupRaw === null || pickupRaw === undefined || String(pickupRaw).trim() === ''
      ? null
      : String(pickupRaw).trim();

  let arriveBy = null;
  if (parsed?.arriveBy) {
    const date = new Date(parsed.arriveBy);
    if (!Number.isNaN(date.getTime())) {
      arriveBy = date.toISOString();
    }
  }

  return {
    pickupQuery,
    dropoffQuery,
    arriveBy,
    preference: normalizePreference(parsed?.preference),
    source: 'openai',
  };
}

/**
 * Call OpenAI to parse a trip prompt into structured intent.
 * @param {{ prompt: string, nowIso?: string, apiKey: string }} args
 */
export async function parseTripWithOpenAI({ prompt, nowIso, apiKey }) {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const trimmed = String(prompt || '').trim();
  if (!trimmed) {
    throw new Error('Describe where you want to go.');
  }

  const now = nowIso || new Date().toISOString();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify({ now, prompt: trimmed }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `OpenAI request failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI returned an empty response.');
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('OpenAI returned invalid JSON.');
  }

  return normalizeIntent(parsed);
}

/**
 * Read a JSON body from a Node IncomingMessage (or Vercel's pre-parsed body).
 */
export function readJsonBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') {
      return Promise.resolve(req.body ? JSON.parse(req.body) : {});
    }
    return Promise.resolve(req.body);
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Shared HTTP handler for POST /api/parse-trip.
 */
export async function handleParseTripRequest(req, res, apiKey) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const body = await readJsonBody(req);
    const intent = await parseTripWithOpenAI({
      prompt: body.prompt,
      nowIso: body.nowIso,
      apiKey,
    });
    res.statusCode = 200;
    res.end(JSON.stringify(intent));
  } catch (error) {
    const message = error?.message || 'Unable to parse trip request.';
    const status = message.includes('OPENAI_API_KEY') ? 503 : 400;
    res.statusCode = status;
    res.end(JSON.stringify({ error: message }));
  }
}
