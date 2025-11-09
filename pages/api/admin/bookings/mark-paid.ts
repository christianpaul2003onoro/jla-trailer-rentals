import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../server/adminauth";
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY as string;
const FROM_EMAIL =
  process.env.RESEND_FROM || "JLA Trailer Rentals <no-reply@send.jlatrailers.com>";
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

type Out = { ok: true } | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Out>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (!requireAdmin(req, res)) return;

  try {
    const { rental_id } = req.body || {};
    if (!rental_id) return res.status(400).json({ ok: false, error: "Missing rental_id" });

    // fetch booking + client + trailer
    const { data: b, error } = await supabaseAdmin
      .from("bookings")
      .select(`
        id, rental_id, start_date, end_date, paid_at, status,
        clients:clients ( email, first_name ),
        trailers:trailers ( name )
      `)
      .eq("rental_id", rental_id)
      .single();

    if (error || !b) return res.status(404).json({ ok: false, error: "Booking not found" });

    // mark Paid
    const { error: updErr } = await supabaseAdmin
      .from("bookings")
      .update({ status: "Paid", paid_at: new Date().toISOString() })
      .eq("id", b.id);

    if (updErr) return res.status(500).json({ ok: false, error: updErr.message });

    // event log (best effort)
    await supabaseAdmin
      .from("booking_events")
      .insert({ booking_id: b.id, kind: "paid", details: { rental_id } })
      .catch(() => {});

    // email (best effort)
    const client = Array.isArray(b.clients) ? b.clients[0] : b.clients;
    const trailer = Array.isArray(b.trailers) ? b.trailers[0] : b.trailers;
    const to = client?.email as string | undefined;

    if (resend && FROM_EMAIL && to) {
      const subject = `Payment received — ${b.rental_id}`;
      const html = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#0b1220">
          <p>${client?.first_name ? `Hi ${client.first_name},` : "Hello,"}</p>
          <p>Thanks for renting with <strong>JLA Trailer Rentals</strong> — we’ve received your payment.</p>
          <p>${trailer?.name ? `Trailer: <strong>${trailer.name}</strong><br/>` : ""}
             Dates: <strong>${b.start_date}</strong> → <strong>${b.end_date}</strong></p>
          <p>Pickup/delivery details are arranged. We’ll contact you if needed.<br/>
             Questions? Call (786) 760-6175 or email JLAtrailerrental@gmail.com.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
          <p style="font-size:12px;color:#64748b">JLA Trailer Rentals • Miami, FL</p>
        </div>`;
      await resend.emails.send({ from: FROM_EMAIL, to, subject, html }).catch(() => {});
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Server error" });
  }
}
