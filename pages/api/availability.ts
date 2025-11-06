// pages/api/availability.ts
// Check if a trailer is free for a given date range.
// Overlap rule: any ACTIVE booking whose [start_date, end_date] intersects the requested range.

import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import { requireAdmin } from "../../server/adminauth"; // keep this while used by Admin only

type Ok = {
  ok: true;
  available: boolean;
  conflicts: Array<{
    rentalId: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
};

type Err = { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  // Lock to admins for now (remove if you later expose this to public UI)
  if (!requireAdmin(req, res)) return;

  const { trailerId, startDate, endDate, excludeBookingId } = req.body || {};

  if (!trailerId || !startDate || !endDate) {
    return res
      .status(400)
      .json({ ok: false, error: "Missing trailerId, startDate, or endDate." });
  }

  // Basic guards
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (
    typeof startDate !== "string" ||
    typeof endDate !== "string" ||
    !iso.test(startDate) ||
    !iso.test(endDate)
  ) {
    return res
      .status(400)
      .json({ ok: false, error: "Dates must be YYYY-MM-DD strings." });
  }
  if (new Date(startDate) > new Date(endDate)) {
    return res
      .status(400)
      .json({ ok: false, error: "startDate must be <= endDate." });
  }

  // Active bookings that block availability
  const ACTIVE = ["Pending", "Approved", "Paid"];

  // Overlap condition (inclusive):
  // existing.start_date <= requested.endDate AND existing.end_date >= requested.startDate
  let query = supabaseAdmin
    .from("bookings")
    .select("id,rental_id,start_date,end_date,status")
    .eq("trailer_id", trailerId)
    .in("status", ACTIVE)
    .lte("start_date", endDate)
    .gte("end_date", startDate);

  // When rescheduling, ignore the booking we're editing
  if (excludeBookingId) {
    query = query.neq("id", excludeBookingId);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: "Query failed." });
  }

  const conflicts =
    (data || []).map((b: any) => ({
      rentalId: b.rental_id,
      startDate: b.start_date,
      endDate: b.end_date,
      status: b.status,
    })) ?? [];

  return res.status(200).json({
    ok: true,
    available: conflicts.length === 0,
    conflicts,
  });
}
