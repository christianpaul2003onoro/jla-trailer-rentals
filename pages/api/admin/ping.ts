// pages/api/admin/ping.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../server/adminauth";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAdmin(req, res)) return res.status(401).json({ ok: false });
  return res.status(200).json({ ok: true });
}
