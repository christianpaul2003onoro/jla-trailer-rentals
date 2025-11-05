// pages/api/admin/bookings/approve.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// env
const resendKey = process.env.RESEND_API_KEY!;
const fromEmail = process.env.EMAIL_FROM || "noreply@jlatrailers.com";

// init
const resend = new Resend(resendKey);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // needs row-level access to update
);

type Body = {
  bookingId: string;
  paymentLink: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  // TODO: your admin auth check here (cookie/session)
  // if (!isAdmin(req)) return res.status(401).json({ ok: false, error: "Unauthorized" });

  const { bookingId, paymentLink } = req.body as Body;

  // very light validation
  try {
    const u = new URL(paymentLink);
    if (!/^https?:/.test(u.protocol)) throw new Error();
  } catch {
    return res.status(400).json({ ok: false, error: "Invalid payment link URL" });
  }

  // get booking, customer email
  const { data: booking, error: qErr } = await supabase
    .from("bookings")
    .select("id, code, status, customer_name, customer_email, start_date, end_date, trailer_name")
    .eq("id", bookingId)
    .single();

  if (qErr || !booking) return res.status(404).json({ ok: false, error: "Booking not found" });

  // update booking -> Approved + link
  const now = new Date().toISOString();
  const { error: upErr } = await supabase
    .from("bookings")
    .update({
      status: "approved",
      payment_link: paymentLink,
      approved_at: now,
      payment_link_sent_at: now
    })
    .eq("id", bookingId);

  if (upErr) return res.status(500).json({ ok: false, error: "Failed to update booking" });

  // audit event
  await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: "Approved",
    details: { payment_link_preview: paymentLink.substring(0, 60) + (paymentLink.length > 60 ? "…" : "") }
  });

  // compose email
  const subject = `Your JLA Trailer Rental #${booking.code} — Payment Link`;
  const html = `
  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial">
    <h2 style="margin:0 0 12px">Hi ${escapeHtml(booking.customer_name || "there")},</h2>
    <p>Your rental has been <strong>approved</strong> ✅.</p>
    <p style="margin:12px 0 6px"><strong>Booking:</strong> ${escapeHtml(booking.code)}</p>
    <p style="margin:6px 0"><strong>Trailer:</strong> ${escapeHtml(booking.trailer_name || "Trailer")}</p>
    <p style="margin:6px 0"><strong>Dates:</strong> ${fmtDate(booking.start_date)} → ${fmtDate(booking.end_date)}</p>

    <p style="margin:16px 0">To confirm your reservation, please complete payment:</p>
    <p style="margin:16px 0">
      <a href="${paymentLink}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700">
        Pay Securely
      </a>
    </p>
    <p style="margin:8px 0">Or open this link: <br/><a href="${paymentLink}">${paymentLink}</a></p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0" />
    <p style="font-size:12px;color:#6b7280">
      JLA Trailer Rentals • Local pickup in Miami<br/>
      Need help? Reply to this email.
    </p>
  </div>`.trim();

  try {
    await resend.emails.send({
      from: `JLA Trailer Rentals <${fromEmail}>`,
      to: booking.customer_email,
      subject,
      html
    });
  } catch (e: any) {
    // if email fails, roll back email timestamp (keep approved status)
    await supabase.from("bookings").update({ payment_link_sent_at: null }).eq("id", bookingId);
    return res.status(502).json({ ok: false, error: "Email send failed", detail: e?.message });
  }

  return res.json({ ok: true });
}

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]!));
}
