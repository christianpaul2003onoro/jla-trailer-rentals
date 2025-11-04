// pages/api/admin/logout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { clearSessionCookie } from "../../../server/adminauth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" } as any);
  }
  res.setHeader("Set-Cookie", clearSessionCookie());
  return res.status(200).json({ ok: true } as any);
}
