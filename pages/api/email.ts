//pages/api/email.ts

import { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { to, subject, message } = req.body;

    const data = await resend.emails.send({
      from: "JLA Trailer Rentals <noreply@jlatrailers.com>",
      to,
      subject,
      html: `<div style="font-family:Arial,sans-serif;font-size:16px;color:#111">
              <p>${message}</p>
              <hr />
              <p style="font-size:13px;color:#555">Thank you,<br>JLA Trailer Rentals</p>
             </div>`,
    });

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
