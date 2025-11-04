// pages/api/admin/login.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { makeSessionCookie } from "../../../server/adminauth";

type Out = { ok: true } | { ok: false; error: string };

export default function handler(req: NextApiRequest, res: NextApiResponse<Out>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const password = String((req.body?.password ?? "")).trim();
  const need = process.env.ADMIN_PASSWORD || "";
  if (!need) return res.status(500).json({ ok: false, error: "Server missing ADMIN_PASSWORD" });
  if (!password || password !== need) return res.status(401).json({ ok: false, error: "Invalid password" });

  try {
    res.setHeader("Set-Cookie", makeSessionCookie());
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Cookie error" });
  }
}
