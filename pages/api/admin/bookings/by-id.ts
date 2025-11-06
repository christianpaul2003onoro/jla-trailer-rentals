// pages/api/admin/bookings/by-id.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../server/adminauth";

type Out = { ok: true; row: any } | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Out>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!requireAdmin(req, res)) return;

  const id = (req.query.id as string) || "";
  if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select(`
      id, rental_id, status, start_date, end_date, delivery_requested,
      created_at, paid_at, approved_at, payment_link, payment_link_sent_at,
      close_outcome, close_reason,
      trailers:trailers ( name ),
      clients:clients ( first_name, last_name, email )
    `)
    .eq("id", id)
    .single();

  if (error || !data) return res.status(404).json({ ok: false, error: error?.message || "Not found" });
  return res.status(200).json({ ok: true, row: data });
}
