// pages/api/bookings/create.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import { supabaseAdmin } from "../../../lib/supabaseAdmin"; // server-side client (service role)

const RESEND_API_KEY = process.env.RESEND_API_KEY as string;
// You have RESEND_FROM in Vercel (not EMAIL_FROM)
const FROM_EMAIL =
  process.env.RESEND_FROM || "JLA Trailer Rentals <noreply@send.jlatrailers.com>";

const resend = new Resend(RESEND_API_KEY);

function bad(res: NextApiResponse, status: number, error: string) {
  return res.status(status).json({ ok: false, error });
}
function ok(res: NextApiResponse, data: any) {
  return res.status(200).json({ ok: true, ...data });
}
const pickFirst = <T = any>(v: any): T | undefined =>
  !v ? undefined : Array.isArray(v) ? (v[0] as T) : (v as T);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  // 1) Find or create client (RLS-safe)
  let effectiveClientId: string | undefined = client_id;

  if (!effectiveClientId && client_email) {
    const { data: existing, error: findErr } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("email", client_email)
      .maybeSingle();
    if (findErr) return bad(res, 500, `Lookup client failed: ${findErr.message}`);

    if (existing?.id) {
      effectiveClientId = existing.id;
    } else {
      const { data: made, error: makeErr } = await supabaseAdmin
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
      if (makeErr) return bad(res, 500, `Create client failed: ${makeErr.message}`);
      effectiveClientId = made.id;
    }
  }

  if (!effectiveClientId) {
    return bad(res, 400, "Missing client_id or client_email.");
  }

  // 2) Create booking
  const { data: booking, error: insErr } = await supabaseAdmin
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
    .select(
      `
      id, rental_id, status, start_date, end_date, delivery_requested,
      clients:clients ( email, first_name ),
      trailers:trailers ( name )
    `
    )
    .single();

  if (insErr || !booking) {
    return bad(res, 500, insErr?.message || "Insert failed");
  }

  // Optional event log (best-effort) — wrapped in try/catch for type-safety
  try {
    await supabaseAdmin
      .from("booking_events")
      .insert({ booking_id: booking.id, kind: "created", details: { delivery_requested } });
  } catch {
    // ignore logging errors
  }

  const client = pickFirst<{ email?: string; first_name?: string }>(booking.clients);
  const trailer = pickFirst<{ name?: string }>(booking.trailers);

  // 3) Send confirmation email (best-effort)
  let emailSent = false;
  let emailError: string | undefined;

  try {
    const toEmail = client?.email;
    if (!RESEND_API_KEY) {
      emailError = "Missing RESEND_API_KEY";
    } else if (!FROM_EMAIL) {
      emailError = "Missing RESEND_FROM";
    } else if (!toEmail) {
      emailError = "Client email not found";
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
        </div>`;
      await resend.emails.send({ from: FROM_EMAIL, to: toEmail, subject, html });
      emailSent = true;
      console.log(`[create] Confirmation email sent to ${toEmail} for ${booking.rental_id}`);
    }
  } catch (e: any) {
    emailError = e?.message || "Unknown Resend error";
    console.error(`[create] Email failed for ${booking?.rental_id}: ${emailError}`);
  }

  return ok(res, {
    booking,
    emailSent,
    emailError,
    debug: { hasKey: !!RESEND_API_KEY, from: FROM_EMAIL },
  });
}
