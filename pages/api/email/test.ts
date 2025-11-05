import type { NextApiRequest, NextApiResponse } from "next";
import { getResend } from "../../../lib/email/resend";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const resend = getResend();
    const data = await resend.emails.send({
      // Use this sender for initial tests. It works without a verified domain.
      from: "JLA Trailer Rentals <onboarding@resend.dev>",
      to: ["JLAtrailerrental@gmail.com"], // change if you want
      subject: "JLA test email",
      html: `<p>Congrats! Resend is working on jlatrailers.com 🚚</p>`,
    });

    return res.status(200).json({ ok: true, data });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err?.message ?? "unknown error" });
  }
}
