import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// -------- env / config --------
const resend = new Resend(process.env.RESEND_API_KEY as string);

// Prefer a domain-based From once Resend verifies your domain.
// Example: JLA Trailer Rentals <noreply@jlatrailers.com>
const FROM =
  process.env.RESEND_FROM || "onboarding@resend.dev"; // TEMP fallback for testing

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

// -------- tiny helpers --------
function bad(res: NextApiResponse, code: number, msg: string) {
  return res.status(code).json({ ok: false, error: msg });
}

function isValidHttpsUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

// If you already have admin-session middleware, you can replace this check.
function assertAdmin(req: NextApiRequest) {
  // Example: your cookie-based session (adapt to your project)
  // if (!req.cookies?.admin_session) throw new Error("unauthorized");
  return true;
}

// -------- email template --------
function paymentEmailHTML(opts: {
  firstName?: string | null;
  rentalId: string;
  trailerName?: string | null;
  startDate: string;
  endDate: string;
  link: string;
}) {
  const name = (opts.firstName || "there").toString();
  return `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial; line-height:1.6; color:#0f172a">
    <h2 style="margin:0 0 10px">Your JLA Trailer Rental – Action Needed</h2>
    <p>Hi ${name},</p>
    <p>Your booking <strong>${opts.rentalId}</strong> (${opts.trailerName || "Trailer"}) 
       from <strong>${opts.startDate}</strong> to <strong>${opts.endDate}</strong> has been <strong>approved</strong>.</p>

    <p style="margin:16px 0">Please complete the payment/deposit using the secure link below:</p>

    <p style="margin:18px 0">
      <a href="${opts.link}" 
         style="background:#2563eb;color:#fff;padding:12px 16px;border-radius:10px;font-weight:800;text-decoration:none;display:inline-block">
        Pay / Deposit – QuickBooks
      </a>
    </p>

    <p>If the button doesn’t work, copy and paste this URL in your browser:</p>
    <p style="word-break:break-all;color:#334155">${opts.link}</p>

    <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0" />
    <p style="font-size:12px;color:#64748b">
      JLA Trailer Rentals · Miami, FL · jlatrailerental@gmail.com
    </p>
  </div>
  `;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return bad(res, 405, "Method not allowed");
    assertAdmin(req); // adapt to your auth

    const { bookingId, paymentLink } = req.body as {
      bookingId?: string;
      paymentLink?: string;
    };

    if (!bookingId) return bad(res, 400, "Missing bookingId");
    if (!paymentLink || !isValidHttpsUrl(paymentLink))
      return bad(res, 400, "Please provide a valid https paymentLink");

    // 1) Get booking + client info (email, name, trailer, dates)
    const { data: booking, error: fetchErr } = await sb
      .from("bookings")
      .select(
        `
        id,
        rental_id,
        status,
        start_date,
        end_date,
        clients ( email, first_name ),
        trailers ( name )
      `
      )
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) return bad(res, 404, "Booking not found");

    const customerEmail: string | undefined = booking.clients?.email || undefined;
    if (!customerEmail) return bad(res, 400, "Booking has no customer email");

    // 2) Update booking: set Approved + store link & timestamps
    const { data: updated, error: updErr } = await sb
      .from("bookings")
      .update({
        status: "Approved",
        payment_link: paymentLink,
        approved_at: new Date().toISOString(),
        payment_link_sent_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .select(
        `
        id, rental_id, start_date, end_date,
        clients ( email, first_name ),
        trailers ( name )
      `
      )
      .single();

    if (updErr || !updated) return bad(res, 500, "Failed to update booking");

    // 3) Optional audit trail
    await sb.from("booking_events").insert({
      booking_id: bookingId,
      event_type: "approved",
      details: { payment_link: paymentLink },
    });

    // 4) Send email via Resend
    const subject = `Payment link for your rental ${updated.rental_id}`;
    const html = paymentEmailHTML({
      firstName: updated.clients?.first_name,
      rentalId: updated.rental_id,
      trailerName: updated.trailers?.name,
      startDate: updated.start_date,
      endDate: updated.end_date,
      link: paymentLink,
    });

    const emailResp = await resend.emails.send({
      from: FROM, // e.g. "JLA Trailer Rentals <noreply@jlatrailers.com>"
      to: [customerEmail],
      subject,
      html,
    });

    if ((emailResp as any)?.error) {
      // If email fails, keep booking Approved but report the error
      return res.status(200).json({
        ok: true,
        row: updated,
        email: { ok: false, error: (emailResp as any).error },
      });
    }

    return res.status(200).json({ ok: true, row: updated, email: { ok: true } });
  } catch (e: any) {
    console.error(e);
    return bad(res, 500, e?.message || "Unexpected error");
  }
}
