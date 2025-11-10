import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../server/adminauth";
import { Resend } from "resend";
import { paymentReceiptHTML } from "../../../../server/emailTemplates";

const RESEND_API_KEY = process.env.RESEND_API_KEY as string | undefined;
const FROM_EMAIL =
  process.env.RESEND_FROM || "JLA Trailer Rentals <no-reply@send.jlatrailers.com>";
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

type Out = { ok: true; emailed: boolean } | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Out>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (!requireAdmin(req, res)) return;

  try {
    const { rental_id } = (req.body ?? {}) as { rental_id?: string };
    if (!rental_id) {
      return res.status(400).json({ ok: false, error: "Missing rental_id" });
    }

    // Fetch booking with client + trailer
    const { data: b, error } = await supabaseAdmin
      .from("bookings")
      .select(`
        id, rental_id, start_date, end_date, paid_at, status,
        clients:clients ( email, first_name ),
        trailers:trailers ( name )
      `)
      .eq("rental_id", rental_id)
      .single();

    if (error || !b) {
      return res.status(404).json({ ok: false, error: "Booking not found" });
    }

    // Idempotency: already paid? don’t re-email.
    if (b.paid_at || b.status === "Paid") {
      return res.status(200).json({ ok: true, emailed: false });
    }

    // Mark as Paid
    const { error: updErr } = await supabaseAdmin
      .from("bookings")
      .update({ status: "Paid", paid_at: new Date().toISOString() })
      .eq("id", b.id);

    if (updErr) {
      return res.status(500).json({ ok: false, error: updErr.message });
    }

    // Best-effort: log event
    try {
      await supabaseAdmin
        .from("booking_events")
        .insert({ booking_id: b.id, kind: "paid", details: { rental_id } });
    } catch {
      /* ignore */
    }

    // Best-effort: email receipt via template
    let emailed = false;
    const client = Array.isArray(b.clients) ? b.clients[0] : b.clients;
    const trailer = Array.isArray(b.trailers) ? b.trailers[0] : b.trailers;
    const to = client?.email as string | undefined;

    if (resend && FROM_EMAIL && to) {
      const html = paymentReceiptHTML({
        firstName: client?.first_name ?? null,
        rentalId: b.rental_id,
        trailerName: trailer?.name ?? null,
        startDateISO: b.start_date,
        endDateISO: b.end_date,
      });

      try {
        const resp = await resend.emails.send({
          from: FROM_EMAIL,
          to,
          subject: `Payment received — ${b.rental_id}`,
          html,
        });
        emailed = !!resp?.data?.id;
      } catch {
        /* ignore */
      }
    }

    return res.status(200).json({ ok: true, emailed });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Server error" });
  }
}
