// pages/api/admin/bookings/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../server/adminauth";
import { Resend } from "resend";
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




type Ok = { ok: true; row?: any };
type Err = { ok: false; error: string };
type Out = Ok | Err;

const RESEND_API_KEY = process.env.RESEND_API_KEY as string | undefined;
const FROM_EMAIL =
  process.env.RESEND_FROM || "JLA Trailer Rentals <no-reply@send.jlatrailers.com>";
const REVIEW_URL =
  process.env.REVIEW_URL || "https://g.page/r/YOUR_PUBLIC_REVIEW_LINK";
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Explicit union type for the helper result
type JoinedRow = { row: any } | { error: string };

// helper to fetch one joined row (safe for UI to use after updates)
async function getJoinedRow(id: string): Promise<JoinedRow> {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select(
      `
      id,rental_id,status,start_date,end_date,delivery_requested,created_at,paid_at,approved_at,payment_link,payment_link_sent_at,close_outcome,close_reason,trailer_id,
      trailers:trailers(name),
      clients:clients(first_name,last_name,email)
    `
    )
    .eq("id", id)
    .single();
  if (error || !data) return { error: error?.message ?? "Not found" };
  return { row: data };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Out>
) {
  if (!requireAdmin(req, res)) return;

  const { id } = req.query as { id: string };

  if (req.method === "GET") {
    const got = await getJoinedRow(id);
    if ("error" in got) return res.status(400).json({ ok: false, error: got.error });
    return res.status(200).json({ ok: true, row: got.row });
  }

  if (req.method === "PATCH") {
    try {
      const body = req.body || {};

      // RESCHEDULE
      if (body.reschedule_start && body.reschedule_end) {
        const { data: updated, error: updErr } = await supabaseAdmin
          .from("bookings")
          .update({
            start_date: body.reschedule_start,
            end_date: body.reschedule_end,
          })
          .eq("id", id)
          .select(
            `
            id,rental_id,status,start_date,end_date,delivery_requested,created_at,paid_at,approved_at,payment_link,payment_link_sent_at,close_outcome,close_reason,trailer_id,
            trailers:trailers(name),
            clients:clients(first_name,last_name,email)
          `
          )
          .single();

        if (updErr || !updated) {
          return res.status(500).json({ ok: false, error: updErr?.message || "Update failed" });
        }

        // notify customer (best effort)
        try {
          if (resend && FROM_EMAIL) {
            const client = Array.isArray(updated.clients) ? updated.clients[0] : updated.clients;
            const trailer = Array.isArray(updated.trailers) ? updated.trailers[0] : updated.trailers;
            const to = client?.email as string | undefined;
            if (to) {
              const subject = `Your booking has been rescheduled — ${updated.rental_id}`;
              const start = updated.start_date;
              const end = updated.end_date;
              const html = `
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#0b1220">
                  <p>${client?.first_name ? `Hi ${client.first_name},` : "Hello,"}</p>
                  <p>Your booking with <strong>JLA Trailer Rentals</strong> has been rescheduled.</p>
                  <p>${trailer?.name ? `Trailer: <strong>${trailer.name}</strong><br/>` : ""}New dates: <strong>${start}</strong> → <strong>${end}</strong></p>
                  <p>If anything looks wrong, reply to this email or call (786) 760-6175.</p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
                  <p style="font-size:12px;color:#64748b">JLA Trailer Rentals • Miami, FL</p>
                </div>
              `;
              await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
            }
          }
        } catch { /* ignore */ }

        return res.status(200).json({ ok: true, row: updated });
      }

      // CLOSE (Finished / Cancelled), with optional emails
      if (body.status === "Closed") {
        const toUpdate: any = {
          status: "Closed",
          close_outcome: body.close_outcome ?? null,
          close_reason: body.close_reason ?? null,
        };

        const { data: updated, error: updErr } = await supabaseAdmin
          .from("bookings")
          .update(toUpdate)
          .eq("id", id)
          .select(
            `
            id,rental_id,status,start_date,end_date,delivery_requested,created_at,paid_at,approved_at,payment_link,payment_link_sent_at,close_outcome,close_reason,trailer_id,
            trailers:trailers(name),
            clients:clients(first_name,last_name,email)
          `
          )
          .single();

        if (updErr || !updated) {
          return res.status(500).json({ ok: false, error: updErr?.message || "Update failed" });
        }

        // emails (best effort)
        try {
          if (resend && FROM_EMAIL) {
            const client = Array.isArray(updated.clients) ? updated.clients[0] : updated.clients;
            const trailer = Array.isArray(updated.trailers) ? updated.trailers[0] : updated.trailers;
            const to = client?.email as string | undefined;

            if (to && updated.close_outcome === "completed" && body.send_thank_you) {
              const subject = `Thank you — ${updated.rental_id} completed`;
              const html = `
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#0b1220">
                  <p>${client?.first_name ? `Hi ${client.first_name},` : "Hello,"}</p>
                  <p>Thanks for choosing <strong>JLA Trailer Rentals</strong>! Your rental is marked as <strong>completed</strong>.</p>
                  <p>${trailer?.name ? `Trailer: <strong>${trailer.name}</strong><br/>` : ""}Dates: <strong>${updated.start_date}</strong> → <strong>${updated.end_date}</strong></p>
                  <p>We’d love your feedback. Please take a moment to leave us a quick review:</p>
                  <p><a href="${REVIEW_URL}" target="_blank" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700">Leave a Review</a></p>
                  <p>Need anything else? Call (786) 760-6175 or reply to this email.</p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
                  <p style="font-size:12px;color:#64748b">JLA Trailer Rentals • Miami, FL</p>
                </div>
              `;
              await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
            }

            if (to && updated.close_outcome === "cancelled" && body.send_cancel_email) {
              const subject = `Booking cancelled — ${updated.rental_id}`;
              const reason = updated.close_reason ? `Reason: ${updated.close_reason}` : "";
              const html = `
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#0b1220">
                  <p>${client?.first_name ? `Hi ${client.first_name},` : "Hello,"}</p>
                  <p>Your booking with <strong>JLA Trailer Rentals</strong> has been <strong>cancelled</strong>.</p>
                  <p>${trailer?.name ? `Trailer: <strong>${trailer.name}</strong><br/>` : ""}Dates were: <strong>${updated.start_date}</strong> → <strong>${updated.end_date}</strong></p>
                  <p>${reason}</p>
                  <p>If this was unexpected, please reply to this email or call (786) 760-6175.</p>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
                  <p style="font-size:12px;color:#64748b">JLA Trailer Rentals • Miami, FL</p>
                </div>
              `;
              await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
            }
          }
        } catch { /* ignore */ }

        return res.status(200).json({ ok: true, row: updated });
      }

      // Fallback – nothing matched
      return res.status(400).json({ ok: false, error: "Invalid PATCH body." });
    } catch (e: any) {
      return res.status(500).json({ ok: false, error: e?.message || "Server error" });
    }
  }

  res.setHeader("Allow", "GET,PATCH");
  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
