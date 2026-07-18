/**
 * Shared Whisper transcription for Vercel and Vite dev middleware.
 */

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
 * Transcribe base64 audio via OpenAI Whisper.
 * @param {{ audioBase64: string, mimeType?: string, apiKey: string }} args
 */
export async function transcribeWithWhisper({ audioBase64, mimeType = 'audio/webm', apiKey }) {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  if (!audioBase64) {
    throw new Error('No audio provided.');
  }

  const buffer = Buffer.from(audioBase64, 'base64');
  if (buffer.length < 100) {
    throw new Error('Audio clip too short.');
  }

  const extension = mimeType.includes('mp4')
    ? 'mp4'
    : mimeType.includes('mpeg') || mimeType.includes('mp3')
      ? 'mp3'
      : mimeType.includes('wav')
        ? 'wav'
        : 'webm';

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType }), `speech.${extension}`);
  form.append('model', 'whisper-1');
  form.append('language', 'en');
  form.append('response_format', 'json');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(
      `Whisper request failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`
    );
  }

  const data = await response.json();
  return String(data?.text || '').trim();
}

/**
 * Shared HTTP handler for POST /api/transcribe
 */
export async function handleTranscribeRequest(req, res, apiKey) {
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
    const text = await transcribeWithWhisper({
      audioBase64: body.audioBase64,
      mimeType: body.mimeType,
      apiKey,
    });
    res.statusCode = 200;
    res.end(JSON.stringify({ text, source: 'whisper' }));
  } catch (error) {
    const message = error?.message || 'Unable to transcribe audio.';
    const status = message.includes('OPENAI_API_KEY') ? 503 : 400;
    res.statusCode = status;
    res.end(JSON.stringify({ error: message }));
  }
}
