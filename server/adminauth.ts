// server/adminauth.ts
// Simple cookie-based admin session. No header tokens anymore.

import type { NextApiRequest, NextApiResponse } from "next";
import { serialize, parse } from "cookie";

const COOKIE_NAME      = "jla_admin";
const COOKIE_MAX_AGE   = 60 * 60 * 8; // 8h
const COOKIE_PATH      = "/";
const SAME_SITE: "lax" | "strict" | "none" = "lax";

// Create the cookie that marks the admin as logged in.
export function makeSessionCookie(): string {
  const secret = process.env.ADMIN_COOKIE_SECRET || "";
  if (!secret) throw new Error("Missing ADMIN_COOKIE_SECRET");
  return serialize(COOKIE_NAME, secret, {
    path: COOKIE_PATH,
    httpOnly: true,
    secure: true,
    sameSite: SAME_SITE,
    maxAge: COOKIE_MAX_AGE,
  });
}

// Clear the cookie.
export function clearSessionCookie(): string {
  return serialize(COOKIE_NAME, "", {
    path: COOKIE_PATH,
    httpOnly: true,
    secure: true,
    sameSite: SAME_SITE,
    maxAge: 0,
  });
}

// Check the request cookies and confirm admin session is valid.
export function requireAdmin(req: NextApiRequest, res?: NextApiResponse): boolean {
  const cookiesHeader = req.headers.cookie || "";
  const cookies = parse(cookiesHeader);
  const have = cookies[COOKIE_NAME];
  const need = process.env.ADMIN_COOKIE_SECRET || "";
  if (!need) {
    if (res) res.status(500).json({ ok: false, error: "Server missing ADMIN_COOKIE_SECRET" } as any);
    return false;
  }
  if (!have || have !== need) {
    if (res) res.status(401).json({ ok: false, error: "Unauthorized" } as any);
    return false;
  }
  return true;
}
