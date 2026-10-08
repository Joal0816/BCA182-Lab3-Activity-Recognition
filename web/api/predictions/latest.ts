import type { VercelRequest, VercelResponse } from '@vercel/node';
import ingestHandler from '../ingest.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  req.method = 'GET';
  return ingestHandler(req, res);
}
