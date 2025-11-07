// pages/api/admin/bookings/index.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../server/adminauth";

type Out = { ok: true; rows: any[] } | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Out>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!requireAdmin(req, res)) return;

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select(`
      id,
      rental_id,
      status,
      created_at,
      start_date,
      end_date,
      delivery_requested,
      trailer_id,
      clients:clients ( first_name, last_name, email ),
      trailers:trailers ( name )
    `)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ ok: false, error: error.message });
  return res.status(200).json({ ok: true, rows: data || [] });
}
