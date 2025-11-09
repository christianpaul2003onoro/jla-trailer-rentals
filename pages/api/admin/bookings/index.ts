// pages/api/admin/bookings/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../server/adminauth";

type Out =
  | { ok: true; rows: any[] }
  | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Out>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (!requireAdmin(req, res)) return;

  // ✅ Clean, parsable select (no inline comments), include trailer_id for availability checks
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select(`
      id,
      rental_id,
      status,
      start_date,
      end_date,
      delivery_requested,
      created_at,
      approved_at,
      paid_at,
      payment_link,
      payment_link_sent_at,
      close_outcome,
      close_reason,
      trailer_id,
      trailers:trailers ( name ),
      clients:clients ( first_name, last_name, email )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.status(200).json({ ok: true, rows: data ?? [] });
}
