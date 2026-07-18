import { handleTranscribeRequest } from './_lib/transcribeWithWhisper.js';

/**
 * Vercel serverless entry: POST /api/transcribe
 */
export default async function handler(req, res) {
  await handleTranscribeRequest(req, res, process.env.OPENAI_API_KEY);
}
