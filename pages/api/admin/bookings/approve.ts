// pages/api/admin/bookings/approve.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { requireAdmin } from "../../../../server/adminauth";
import { bookingApprovedHTML } from "../../../../server/emailTemplates";
import { createCalendarEvent } from "../../../../server/calendarSync";

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

/**
 * Combine a YYYY-MM-DD date with an HH:mm pickup time.
 * If time is missing or malformed, returns the original date (date-only).
 */
function combineDateAndTime(date: string, time?: string | null): string {
  if (!time) return date; // falls back to default hours in calendarSync

  const trimmed = time.trim();
  // Accept "HH:mm" (e.g. "09:00", "17:30")
  if (!/^\d{2}:\d{2}$/.test(trimmed)) {
    return date;
  }

  return `${date}T${trimmed}:00`;
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

  // 1) Fetch booking + client + trailer (INCLUDE pickup_time)
  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select(
      `
      id,
      rental_id,
      status,
      start_date,
      end_date,
      pickup_time,
      delivery_requested,
      payment_link,
      payment_link_sent_at,
      approved_at,
      calendar_event_id,
      clients:clients ( email, first_name, last_name ),
      trailers:trailers ( name, color_hex )

    `
    )
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) return bad(res, 404, "Booking not found");

  const clientRec = first<{ email?: string; first_name?: string; last_name?: string }>(
    booking.clients as any
  );
    const trailerRec = first<{ name?: string; color_hex?: string }>(booking.trailers as any);


  const customerEmail = clientRec?.email;
  if (!customerEmail) return bad(res, 400, "Booking has no customer email");

  const customerName =
    [clientRec?.first_name, clientRec?.last_name].filter(Boolean).join(" ") ||
    "Client";

  // Build start/end with pickup time for calendar (24h cycle)
  const pickupTime = booking.pickup_time as string | null;
  const startForCalendar = combineDateAndTime(
    booking.start_date as string,
    pickupTime
  );
  const endForCalendar = combineDateAndTime(
    booking.end_date as string,
    pickupTime
  );

  // 2) Google Calendar: create event (best effort, but surface errors)
  let calendarEventId: string | null = null;
  let calendarError: string | null = null;
  try {
       calendarEventId = await createCalendarEvent({
      rentalId: booking.rental_id as string,
      trailerName: trailerRec?.name ?? null,
      customerName,
      startDate: booking.start_date as string,
      endDate: booking.end_date as string,
      delivery: !!booking.delivery_requested,
      trailerColorHex: trailerRec?.color_hex ?? null,
    });

  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error("[Approve] CALENDAR_CREATE_ON_APPROVE_ERROR:", errorMessage);
    calendarError = errorMessage;
  }

  // 3) Update → Approved + link + timestamps (+ calendar_event_id if we got one)
  const nowISO = new Date().toISOString();
  const { data: updated, error: updErr } = await supabase
    .from("bookings")
    .update({
      status: "Approved",
      payment_link: paymentLink,
      approved_at: nowISO,
      payment_link_sent_at: nowISO,
      calendar_event_id: calendarEventId ?? booking.calendar_event_id ?? null,
    })
    .eq("id", bookingId)
    .select(
      `
      id,
      rental_id,
      status,
      start_date,
      end_date,
      delivery_requested,
      created_at,
      paid_at,
      approved_at,
      payment_link,
      payment_link_sent_at,
      close_outcome,
      close_reason,
      trailer_id,
      calendar_event_id,
      clients:clients ( email, first_name, last_name ),
      trailers:trailers ( name )
    `
    )
    .single();

  if (updErr || !updated) return bad(res, 500, "Failed to update booking");

  const updatedClient = first<{ email?: string; first_name?: string }>(
    updated.clients as any
  );
  const updatedTrailer = first<{ name?: string }>(updated.trailers as any);

  // 4) Send “Approved + Pay & Confirm” email
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
  } catch (e: unknown) {
    const emailErrorMessage =
      e instanceof Error ? e.message : "Failed to send email";
    // Still return success with emailSent=false so UI can show a toast
    return ok(res, {
      row: updated,
      emailSent: false,
      emailError: emailErrorMessage,
      calendarEventId,
      calendarError,
    });
  }

  return ok(res, {
    row: updated,
    emailSent: true,
    calendarEventId,
    calendarError,
  });
}
