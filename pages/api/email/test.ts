// pages/api/email/test.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { resend } from '../../../lib/email/resend';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = await resend.emails.send({
      from: 'JLA Trailer Rentals <onboarding@resend.dev>', // safe for first tests
      to: ['JLAtrailerrental@gmail.com'],                  // change to your test email
      subject: 'JLA test email',
      html: `<p>Congrats! Resend is working on jlatrailers.com 🚚</p>`
    });

    return res.status(200).json({ ok: true, data });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err?.message ?? 'unknown error' });
  }
}
