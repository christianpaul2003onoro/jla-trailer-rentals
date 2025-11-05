import type { NextApiRequest, NextApiResponse } from "next";
import { getResend } from "../../../lib/email/resend";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const resend = getResend();
   // pages/api/email/test.ts
const data = await resend.emails.send({
  from: "JLA Trailer Rentals <onboarding@resend.dev>",
  to: ["christianpaul2003onoro@gmail.com"], // ← must be the same email on your Resend account
  subject: "JLA test email",
  html: `<p>Congrats! Resend is working 🚚</p>`,
});


    return res.status(200).json({ ok: true, data });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err?.message ?? "unknown error" });
  }
}
