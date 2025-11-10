//pages/api/admin/bookings/approve.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { requireAdmin } from "../../../../server/adminauth";
import { bookingApprovedHTML } from "../../../../server/emailTemplates";

/* ---------- ENV & CLIENTS ---------- */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE as string;
const RESEND_API_KEY = process.env.RESEND_API_KEY as string;
const FROM_EMAIL =
  process.env.RESEND_FROM || "JLA Trailer Rentals <no-reply@send.jlatrailers.com>";

if (!SUPABASE_URL) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE) throw new Error("Missing SUPABASE_SERVICE_ROLE");
if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});
const resend = new Resend(RESEND_API_KEY);

/* ---------- HELPERS ---------- */
type MaybeArr<T> = T | T[] | null | undefined;
const first = <T,>(v: MaybeArr<T>): T | undefined =>
  Array.isArray(v) ? v[0] : (v ?? undefined);

const bad = (res: NextApiResponse, status: number, message: string) =>
  res.status(status).json({ ok: false, error: message });

const ok = (res: NextApiResponse, data: any) =>
  res.status(200).json({ ok: true, ...data });

function isHttpUrl(s?: string): s is string {
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/* ---------- HANDLER ---------- */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return bad(res, 405, "Method not allowed");
  }

  // Require admin cookie session
  if (!requireAdmin(req, res)) return;

  // Expect: { bookingId, paymentLink }
  const { bookingId, paymentLink } = (req.body ?? {}) as {
    bookingId?: string;
    paymentLink?: string;
  };

  if (!bookingId) return bad(res, 400, "Missing bookingId");
  if (!isHttpUrl(paymentLink))
    return bad(res, 400, "Invalid paymentLink (must be http/https)");

  // 1) Fetch booking + client + trailer
  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select(
      `
      id, rental_id, status, start_date, end_date,
      payment_link, payment_link_sent_at, approved_at,
      clients:clients ( email, first_name ),
      trailers:trailers ( name )
    `
    )
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) return bad(res, 404, "Booking not found");

  const clientRec = first<{ email?: string; first_name?: string }>(
    booking.clients as any
  );
  const trailerRec = first<{ name?: string }>(booking.trailers as any);

  const customerEmail = clientRec?.email;
  if (!customerEmail) return bad(res, 400, "Booking has no customer email");

  // 2) Update → Approved + link + timestamps
  const nowISO = new Date().toISOString();
  const { data: updated, error: updErr } = await supabase
    .from("bookings")
    .update({
      status: "Approved",
      payment_link: paymentLink,
      approved_at: nowISO,
      payment_link_sent_at: nowISO,
    })
    .eq("id", bookingId)
    .select(
      `
      id, rental_id, status, start_date, end_date, payment_link, payment_link_sent_at, approved_at,
      clients:clients ( email, first_name ),
      trailers:trailers ( name )
    `
    )
    .single();

  if (updErr || !updated) return bad(res, 500, "Failed to update booking");

  const updatedClient = first<{ email?: string; first_name?: string }>(
    updated.clients as any
  );
  const updatedTrailer = first<{ name?: string }>(updated.trailers as any);

  // 3) Send “Approved + Pay & Confirm” email using the branded template
  const subject = `Approved — ${updated.rental_id}`;
  const html = bookingApprovedHTML({
    firstName: updatedClient?.first_name ?? null,
    rentalId: updated.rental_id,
    trailerName: updatedTrailer?.name ?? null,
    startDateISO: updated.start_date,
    endDateISO: updated.end_date,
    paymentLink: paymentLink!, // validated above
  });

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject,
      html,
    });
  } catch (e: any) {
    // Still return success with emailSent=false so UI can show a toast
    return ok(res, {
      row: updated,
      emailSent: false,
      emailError: e?.message || "Failed to send email",
    });
  }

  return ok(res, { row: updated, emailSent: true });
}
