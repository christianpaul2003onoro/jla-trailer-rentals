import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const key = process.env.RESEND_API_KEY || '';
  res.status(200).json({
    hasRESEND_API_KEY: Boolean(key),
    keyLength: key.length,
    nodeEnv: process.env.NODE_ENV,
  });
}
