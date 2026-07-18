import { handleParseTripRequest } from './_lib/parseTripWithOpenAI.js';

/**
 * Vercel serverless entry: POST /api/parse-trip
 */
export default async function handler(req, res) {
  await handleParseTripRequest(req, res, process.env.OPENAI_API_KEY);
}
