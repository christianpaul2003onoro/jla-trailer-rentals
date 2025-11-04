// pages/api/admin/update-status.ts
// Admin-only endpoint to update a booking's status. No client access.

import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN || ""; // set in Vercel

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  // Simple header check (e.g., Authorization: Bearer <token>)
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const { rentalId, newStatus } = req.body || {};
  const allowed = ["Pending", "Approved", "Paid", "Completed", "Canceled"];
  if (!rentalId || !allowed.includes(newStatus)) {
    return res.status(400).json({ ok: false, error: "Invalid payload." });
  }

  const { error } = await supabaseAdmin
    .from("bookings")
    .update({ status: newStatus })
    .eq("rental_id", rentalId);

  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.status(200).json({ ok: true });
}
