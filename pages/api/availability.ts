// pages/api/availability.ts
// Return whether the selected trailer is available for the requested date range.
// Overlap rule: any booking whose [start_date, end_date] intersects the requested range.
// We count active statuses only.

import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

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

  const { trailerId, startDate, endDate } = req.body || {};
  if (!trailerId || !startDate || !endDate) {
    return res
      .status(400)
      .json({ ok: false, error: "Missing trailerId, startDate, or endDate." });
  }

  // Active bookings that should block new rentals
  const ACTIVE = ["Pending", "Approved", "Paid"];

  // Overlap condition (inclusive):
  // existing.start_date <= requested.endDate AND existing.end_date >= requested.startDate
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("rental_id,start_date,end_date,status")
    .eq("trailer_id", trailerId)
    .in("status", ACTIVE)
    .lte("start_date", endDate)
    .gte("end_date", startDate);

  if (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: "Query failed." });
  }

  const conflicts =
    (data || []).map((b) => ({
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
