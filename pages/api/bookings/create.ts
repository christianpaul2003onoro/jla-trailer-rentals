// pages/api/bookings/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const RESEND_API_KEY = process.env.RESEND_API_KEY as string;
// ✅ Use the same from you used for Approve (verified subdomain)
const FROM_EMAIL = process.env.RESEND_FROM || "JLA Trailer Rentals <noreply@send.jlatrailers.com>";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
const resend = new Resend(RESEND_API_KEY);

type Out =
  | { ok: true; booking: any; emailSent: boolean; emailError?: string | null; debug: any }
  | { ok: false; error: string; debug?: any };

function bad(res: NextApiResponse<Out>, status: number, error: string, debug?: any) {
  return res.status(status).json({ ok: false, error, debug });
}
function ok(res: NextApiResponse<Out>, data: any) {
  return res.status(200).json({ ok: true, ...data });
}
type MaybeArr<T> = T | T[] | null | undefined;
const first = <T,>(v: MaybeArr<T>): T | undefined => (Array.isArray(v) ? v[0] : (v ?? undefined));

export default async function handler(req: NextApiRequest, res: NextApiResponse<Out>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return bad(res, 405, "Method not allowed");
  }

  const {
    client_id,
    trailer_id,
    start_date,
    end_date,
    delivery_requested = false,
    client_first_name,
    client_last_name,
    client_email,
  } = (req.body ?? {}) as Record<string, any>;

  if (!trailer_id || !start_date || !end_date) {
    return bad(res, 400, "Missing trailer_id, start_date, or end_date.");
  }

  // --- Find or create client (if client_id not provided) ---
  let effectiveClientId: string | undefined = client_id;

  if (!effectiveClientId) {
    if (!client_email) {
      return bad(res, 400, "Missing client_email when client_id not provided.");
    }

    const { data: existing, error: findErr } = await supabase
      .from("clients")
      .select("id")
      .eq("email", client_email)
      .maybeSingle();

    if (findErr) return bad(res, 500, "Failed to look up client", { step: "findClient", findErr });

    if (existing?.id) {
      effectiveClientId = existing.id;
    } else {
      const { data: made, error: makeErr } = await supabase
        .from("clients")
        .insert([{ first_name: client_first_name ?? null, last_name: client_last_name ?? null, email: client_email }])
        .select("id")
        .single();

      if (makeErr) return bad(res, 500, "Failed to create client", { step: "createClient", makeErr });
      effectiveClientId = made.id;
    }
  }

  // --- Create booking ---
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
    return bad(res, 500, "Failed to create booking", { step: "insertBooking", insErr });
  }

  // --- Log booking_event (best-effort) ---
  await supabase
    .from("booking_events")
    .insert({ booking_id: booking.id, kind: "created", details: { delivery_requested } })
    .then(() => {}, () => {});

  const client = first<{ email?: string; first_name?: string }>(booking.clients as any);
  const trailer = first<{ name?: string }>(booking.trailers as any);

  // --- Send confirmation email (best-effort) ---
  let emailSent = false;
  let emailError: string | undefined;
  let resendId: string | undefined;

  try {
    const toEmail = client?.email;
    if (!toEmail) {
      emailError = "No client email on booking";
    } else if (!RESEND_API_KEY) {
      emailError = "Missing RESEND_API_KEY";
    } else if (!FROM_EMAIL) {
      emailError = "Missing RESEND_FROM";
    } else {
      const subject = `We received your booking request (${booking.rental_id})`;
      const html = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#0b1220">
          <p>${client?.first_name ? `Hi ${client.first_name},` : "Hello,"}</p>
          <p>Thanks for choosing <strong>JLA Trailer Rentals</strong>! We’ve received your booking request${
            trailer?.name ? ` for <strong>${trailer.name}</strong>` : ""
          }.</p>
          <p>Dates: <strong>${booking.start_date}</strong> → <strong>${booking.end_date}</strong></p>
          <p>${booking.delivery_requested ? "Delivery requested." : "Pickup at our location."}</p>
          <p>We’ll review availability and send a payment link after approval.</p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
          <p style="font-size:12px;color:#64748b">JLA Trailer Rentals • Miami, FL</p>
        </div>`.trim();

      const { data } = await resend.emails.send({
        from: FROM_EMAIL,
        to: toEmail,
        subject,
        html,
      });
      resendId = (data as any)?.id;
      emailSent = true;
      // eslint-disable-next-line no-console
      console.log(`[create] Confirmation email sent -> ${toEmail} (${booking.rental_id}) id=${resendId}`);
    }
  } catch (e: any) {
    emailError = e?.message || "Unknown Resend error";
    // eslint-disable-next-line no-console
    console.error(`[create] Resend error for ${booking?.rental_id}: ${emailError}`);
  }

  return ok(res, {
    booking,
    emailSent,
    emailError: emailError ?? null,
    debug: {
      hasKey: !!RESEND_API_KEY,
      fromUsed: FROM_EMAIL,
      clientEmail: client?.email ?? null,
      resendId: resendId ?? null,
    },
  });
}
