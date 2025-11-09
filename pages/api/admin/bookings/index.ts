// pages/api/admin/bookings/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../server/adminauth";

type Row = {
  id: string;
  rental_id: string;
  status: string;
  start_date: string;
  end_date: string;
  delivery_requested: boolean;
  created_at: string;
  approved_at?: string | null;
  paid_at?: string | null;
  payment_link?: string | null;
  payment_link_sent_at?: string | null;
  close_outcome?: string | null;
  close_reason?: string | null;
  trailer_id?: string | null;
  trailers?: { name?: string | null } | null;
  clients?: { first_name?: string | null; last_name?: string | null; email?: string | null } | null;
};

type Out =
  | { ok: true; rows: Row[] }
  | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Out>) {
  if (!requireAdmin(req, res)) return;

  // Single read for admin table
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select(
      `
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
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }

  return res.status(200).json({ ok: true, rows: (data as Row[]) ?? [] });
}
