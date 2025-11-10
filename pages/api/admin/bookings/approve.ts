// pages/api/admin/bookings/approve.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { requireAdmin } from "../../../../server/adminauth";
import { bookingApprovedHTML } from "../../../../server/emailTemplates";

// ...
const html = bookingApprovedHTML({
  firstName: client?.first_name ?? null,
  rentalId: row.rental_id,
  trailerName: trailer?.name ?? null,
  startDateISO: row.start_date,
  endDateISO: row.end_date,
  paymentLink, // the link you already capture in ApproveModal
});

await resend.emails.send({
  from: FROM_EMAIL,
  to: client.email,
  subject: `Approved — ${row.rental_id}`,
  html,
});





/** ---------- ENV + CLIENTS ---------- */
// Match your Vercel env names exactly.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE as string; // <— this one
const RESEND_API_KEY = process.env.RESEND_API_KEY as string;
const FROM_EMAIL =
  process.env.RESEND_FROM || // <— your var on Vercel
  "JLA Trailer Rentals <no-reply@send.jlatrailers.com>";

if (!SUPABASE_URL) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!SUPABASE_SERVICE_ROLE) throw new Error("Missing SUPABASE_SERVICE_ROLE");
if (!RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});
const resend = new Resend(RESEND_API_KEY);

/** ---------- HELPERS ---------- */
type MaybeArr<T> = T | T[] | null | undefined;
const first = <T,>(v: MaybeArr<T>): T | undefined =>
  Array.isArray(v) ? v[0] : (v ?? undefined);

const bad = (res: NextApiResponse, status: number, message: string) =>
  res.status(status).json({ ok: false, error: message });
const ok = (res: NextApiResponse, data: any) =>
  res.status(200).json({ ok: true, ...data });

function isHttpUrl(s: string) {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function paymentEmailHTML(params: {
  firstName?: string;
  rentalId: string;
  trailerName?: string;
  startDate?: string;
  endDate?: string;
  paymentLink: string;
}) {
  const { firstName, rentalId, trailerName, startDate, endDate, paymentLink } =
    params;
  const greet = firstName ? `Hi ${firstName},` : "Hello,";
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#0b1220">
    <p>${greet}</p>
    <p>Your booking <strong>${rentalId}</strong>${
    trailerName ? ` for <strong>${trailerName}</strong>` : ""
  }${
    startDate && endDate
      ? ` from <strong>${startDate}</strong> to <strong>${endDate}</strong>`
      : ""
  } has been <strong>approved</strong>.</p>
    <p>Please complete your payment using the link below:</p>
    <p><a href="${paymentLink}" style="background:#2563eb;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;display:inline-block">Pay now</a></p>
    <p style="word-break:break-all">${paymentLink}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
    <p style="font-size:12px;color:#64748b">JLA Trailer Rentals • Miami, FL</p>
  </div>`;
}

/** ---------- HANDLER ---------- */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only POST is allowed for this route.
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
  if (!paymentLink || !isHttpUrl(paymentLink))
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

  // 3) Send email via Resend
  const subject = `Payment link for your rental ${updated.rental_id}`;
  const html = paymentEmailHTML({
    firstName: updatedClient?.first_name,
    rentalId: updated.rental_id,
    trailerName: updatedTrailer?.name,
    startDate: updated.start_date,
    endDate: updated.end_date,
    paymentLink,
  });

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject,
      html,
    });
  } catch (e: any) {
    return ok(res, {
      row: updated,
      emailSent: false,
      emailError: e?.message || "Failed to send email",
    });
  }

  return ok(res, { row: updated, emailSent: true });
}
