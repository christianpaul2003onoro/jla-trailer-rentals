// pages/api/bookings/confirm.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

/** ENV */
const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SERVICE_ROLE   = process.env.SUPABASE_SERVICE_ROLE_KEY as string; // server only
const RESEND_API_KEY = process.env.RESEND_API_KEY as string;
const FROM_EMAIL     = process.env.RESEND_FROM || "JLA Trailer Rentals <no-reply@send.jlatrailers.com>";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
const resend   = new Resend(RESEND_API_KEY);

type Out = { ok: true; sent: boolean } | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Out>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { rental_id } = req.body || {};
    if (!rental_id || typeof rental_id !== "string") {
      return res.status(400).json({ ok: false, error: "Missing rental_id" });
    }

    // Fetch booking by rental_id with client + trailer
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        id, rental_id, start_date, end_date, delivery_requested,
        confirmation_sent_at,
        clients:clients ( email, first_name ),
        trailers:trailers ( name )
      `)
      .eq("rental_id", rental_id)
      .single();

    if (error || !booking) return res.status(404).json({ ok: false, error: "Booking not found" });

    // Already sent? Exit gracefully.
    if (booking.confirmation_sent_at) {
      return res.status(200).json({ ok: true, sent: false });
    }

    const client = Array.isArray(booking.clients) ? booking.clients[0] : booking.clients;
    const trailer = Array.isArray(booking.trailers) ? booking.trailers[0] : booking.trailers;

    const toEmail = client?.email as string | undefined;
    if (!toEmail) return res.status(400).json({ ok: false, error: "Booking has no client email" });

    // Build email
    const subject = `We received your booking request (${booking.rental_id})`;
    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#0b1220">
        <p>${client?.first_name ? `Hi ${client.first_name},` : "Hello,"}</p>
        <p>Thanks for choosing <strong>JLA Trailer Rentals</strong>!
        ${trailer?.name ? ` Your request is for <strong>${trailer.name}</strong>.` : ""}</p>
        <p>Dates: <strong>${booking.start_date}</strong> → <strong>${booking.end_date}</strong></p>
        <p>${booking.delivery_requested ? "Delivery requested." : "Pickup at our location."}</p>
        <p>We’ll review availability and send a payment link after approval.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
        <p style="font-size:12px;color:#64748b">JLA Trailer Rentals • Miami, FL</p>
      </div>
    `;

    // Send email
    if (!RESEND_API_KEY || !FROM_EMAIL) {
      return res.status(500).json({ ok: false, error: "Email service not configured" });
    }
    await resend.emails.send({ from: FROM_EMAIL, to: toEmail, subject, html });

    // Mark sent
    const { error: updErr } = await supabase
      .from("bookings")
      .update({ confirmation_sent_at: new Date().toISOString() })
      .eq("id", booking.id);

    if (updErr) {
      // Not fatal for user, but log in Vercel logs
      console.warn("[confirm] email sent but failed to stamp:", updErr.message);
    }

    return res.status(200).json({ ok: true, sent: true });
  } catch (e: any) {
    console.error("[confirm] fatal:", e?.message);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}