// pages/api/admin/bookings/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../server/adminauth";
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY as string | undefined;
const FROM_EMAIL =
  process.env.RESEND_FROM || "JLA Trailer Rentals <no-reply@send.jlatrailers.com>";
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

type Ok = { ok: true; row?: any };
type Err = { ok: false; error: string };
type Out = Ok | Err;

export default async function handler(req: NextApiRequest, res: NextApiResponse<Out>) {
  if (!["PATCH", "GET"].includes(req.method || "")) {
    res.setHeader("Allow", "GET, PATCH");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (!requireAdmin(req, res)) return;

  const { id } = req.query as { id: string };

  if (req.method === "GET") {
    const got = await getJoinedRow(id);
    if ("error" in got) return res.status(400).json(got);
    return res.status(200).json({ ok: true, row: got.row });
  }

  // PATCH
  try {
    const body = req.body || {};

    // 1) RESCHEDULE FLOW
    if (body.reschedule_start && body.reschedule_end) {
      const start = String(body.reschedule_start);
      const end = String(body.reschedule_end);
      const sendEmail = !!body.send_reschedule_email;

      // guard: start <= end
      if (new Date(start) > new Date(end)) {
        return res.status(400).json({ ok: false, error: "start_date must be <= end_date." });
      }

      // Update dates
      const { error: updErr } = await supabaseAdmin
        .from("bookings")
        .update({ start_date: start, end_date: end })
        .eq("id", id);

      if (updErr) return res.status(500).json({ ok: false, error: updErr.message });

      // best-effort event log
      try {
        await supabaseAdmin
          .from("booking_events")
          .insert({ booking_id: id, kind: "rescheduled", details: { start, end } });
      } catch {}

      // Email (best-effort)
      if (sendEmail && resend && FROM_EMAIL) {
        const got = await getJoinedRow(id);
        if (!("error" in got)) {
          const row = got.row;
          const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
          const trailer = Array.isArray(row.trailers) ? row.trailers[0] : row.trailers;
          const to = client?.email as string | undefined;

          if (to) {
            const subject = `Updated dates — ${row.rental_id}`;
            const html = `
              <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#0b1220">
                <p>${client?.first_name ? `Hi ${client.first_name},` : "Hello,"}</p>
                <p>Your booking with <strong>JLA Trailer Rentals</strong> has been rescheduled.</p>
                <p>${trailer?.name ? `Trailer: <strong>${trailer.name}</strong><br/>` : ""}
                   New dates: <strong>${start}</strong> → <strong>${end}</strong></p>
                <p>If anything looks wrong, reply to this email or call (786) 760-6175.</p>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0" />
                <p style="font-size:12px;color:#64748b">JLA Trailer Rentals • Miami, FL</p>
              </div>
            `;
            try {
              await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
            } catch {}
          }
        }
      }

      // Return fresh joined row
      const got = await getJoinedRow(id);
      if ("error" in got) return res.status(200).json({ ok: true }); // still OK but no row
      return res.status(200).json({ ok: true, row: got.row });
    }

    // 2) OTHER PATCH ACTIONS (close/cancel/etc.) — keep your existing behavior:
    // Example:
    if (body.status === "Closed") {
      const { close_outcome, close_reason } = body;
      const { error: updErr } = await supabaseAdmin
        .from("bookings")
        .update({ status: "Closed", close_outcome: close_outcome ?? null, close_reason: close_reason ?? null })
        .eq("id", id);

      if (updErr) return res.status(500).json({ ok: false, error: updErr.message });

      const got = await getJoinedRow(id);
      if ("error" in got) return res.status(200).json({ ok: true });
      return res.status(200).json({ ok: true, row: got.row });
    }

    // 3) No recognized action
    return res.status(400).json({ ok: false, error: "Unsupported PATCH body." });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Server error" });
  }
}

async function getJoinedRow(id: string): Promise<{ row: any } | { error: string }> {
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select(`
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
      trailers:trailers(name),
      clients:clients(first_name,last_name,email)
    `)
    .eq("id", id)
    .single();

  if (error) return { error: error.message };
  return { row: data };
}
