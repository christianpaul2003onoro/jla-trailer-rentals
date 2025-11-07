// pages/api/bookings/create.ts
// Public endpoint: creates a booking in "Pending" and emails the customer a confirmation.

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// ---- ENV ----
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const RESEND_API_KEY = process.env.RESEND_API_KEY as string;
const FROM_EMAIL =
  process.env.RESEND_FROM || "JLA Trailer Rentals <no-reply@send.jlatrailers.com>";

// Public supabase client (RLS must allow what you do here)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: { persistSession: false },
});
const resend = new Resend(RESEND_API_KEY);

// Helpers
function bad(res: NextApiResponse, status: number, error: string) {
  return res.status(status).json({ ok: false, error });
}
function ok(res: NextApiResponse, data: any) {
  return res.status(200).json({ ok: true, ...data });
}
type MaybeArr<T> = T | T[] | null | undefined;
const first = <T,>(v: MaybeArr<T>): T | undefined =>
  Array.isArray(v) ? v[0] : (v ?? undefined);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return bad(res, 405, "Method not allowed");
  }

  // Expected body
  const {
    client_id, // optional (if you provide client_* we’ll create/find)
    trailer_id, // required
    start_date, // YYYY-MM-DD
    end_date,   // YYYY-MM-DD
    delivery_requested = false,

    // optional: create/find client by email
    client_first_name,
    client_last_name,
    client_email,
  } = req.body || {};

  if (!trailer_id || !start_date || !end_date) {
    return bad(res, 400, "Missing trailer_id, start_date, or end_date.");
  }

  // Create/find client if needed
  let effectiveClientId: string | undefined = client_id;

  if (!effectiveClientId && client_email) {
    const { data: existing, error: findErr } = await supabase
      .from("clients")
      .select("id")
      .eq("email", client_email)
      .maybeSingle();
    if (findErr) return bad(res, 500, findErr.message);

    if (existing?.id) {
      effectiveClientId = existing.id;
    } else {
      const { data: newClient, error: makeErr } = await supabase
        .from("clients")
        .insert([
          {
            first_name: client_first_name ?? null,
            last_name: client_last_name ?? null,
            email: client_email,
          },
        ])
        .select("id")
        .single();
      if (makeErr) return bad(res, 500, makeErr.message);
      effectiveClientId = newClient.id;
    }
  }

  if (!effectiveClientId) {
    return bad(res, 400, "Missing client_id or client_email.");
  }

  // Create booking (Pending)
  const { data: booking, error: insErr } = await supabase
    .from("bookings")
    .insert([
      {
        client_id: effectiveClientId,
        trailer_id,
        start_date,
        end_date,
        delivery_requested: !!delivery_requested,
        status: "Pending",
      },
    ])
    .select(`
      id, rental_id, status, start_date, end_date, delivery_requested,
      clients:clients ( email, first_name ),
      trailers:trailers ( name )
    `)
    .single();

  if (insErr || !booking) {
    return bad(res, 500, insErr?.message || "Insert failed");
  }

  // Safely read related records (Supabase returns arrays for joins)
  const client = first<{ email?: string; first_name?: string }>(booking.clients as any);
  const trailer = first<{ name?: string }>(booking.trailers as any);

  // Send confirmation email (best-effort)
  try {
    const toEmail = client?.email;
    if (RESEND_API_KEY && FROM_EMAIL && toEmail) {
      const subject = `We received your booking request (${booking.rental_id})`;
      const html = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#0b1220">
          <p>${client?.first_name ? `Hi ${client.first_name},` : "Hello,"}</p>
          <p>Thanks for choosing <strong>JLA Trailer Rentals</strong>! We’ve received your booking request${
            trailer?.name ? ` for <strong>${trailer.name}</strong>` : ""
          }.</p>
          <p>Dates: <strong>${booking.start_date}</strong> → <strong>${booking.end_date}</strong></p>
          <p>${booking.delivery_requested ? "Delivery requested." : "Pickup at our location."}
             Our team will review availability and send you a payment link upon approval.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
          <p style="font-size:12px;color:#64748b">JLA Trailer Rentals • Miami, FL</p>
        </div>`;
      await resend.emails.send({ from: FROM_EMAIL, to: toEmail, subject, html });
    }
  } catch (e: any) {
    console.error("Confirmation email failed:", e?.message || e);
  }

  return ok(res, { booking });
}
