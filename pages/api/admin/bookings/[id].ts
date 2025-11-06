// pages/api/admin/bookings/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../server/adminauth";

type Out = { ok: true; row?: any } | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Out>) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", "PATCH");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Require admin access
  if (!requireAdmin(req, res)) return;

  const id = req.query.id as string;
  if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

  const {
    status,                   // "Approved" | "Paid" | "Closed" | ...
    mark_paid,                // boolean
    close_outcome,            // "completed" | "cancelled"
    close_reason,             // string | null
    reschedule_notify_only,   // boolean

    // ✅ NEW: for rescheduling
    reschedule_start,         // YYYY-MM-DD
    reschedule_end,           // YYYY-MM-DD
  } = (req.body ?? {}) as Record<string, any>;

  // ------------------------
  // Helpers
  // ------------------------
  async function logEvent(kind: string, details: Record<string, any> = {}) {
    await supabaseAdmin
      .from("booking_events")
      .insert({ booking_id: id, kind, details })
      .then(() => {}, () => {}); // ignore logging errors silently
  }

  async function fetchFullRow() {
    return supabaseAdmin
      .from("bookings")
      .select(`
        id, rental_id, status, start_date, end_date, delivery_requested,
        created_at, paid_at, approved_at, payment_link, payment_link_sent_at,
        close_outcome, close_reason,
        trailer_id,                               -- 👈 important for availability checks
        trailers:trailers ( name ),
        clients:clients ( first_name, last_name, email )
      `)
      .eq("id", id)
      .single();
  }

  async function finishAndReturn() {
    const { data: row, error } = await fetchFullRow();
    if (error || !row) {
      return res.status(500).json({ ok: false, error: error?.message || "Fetch failed" });
    }
    return res.status(200).json({ ok: true, row });
  }

  // ------------------------
  // 1️⃣ Reschedule booking
  // ------------------------
  if (reschedule_start && reschedule_end) {
    const iso = /^\d{4}-\d{2}-\d{2}$/;
    if (
      typeof reschedule_start !== "string" ||
      typeof reschedule_end !== "string" ||
      !iso.test(reschedule_start) ||
      !iso.test(reschedule_end)
    ) {
      return res.status(400).json({ ok: false, error: "Invalid reschedule dates" });
    }

    const startDate = new Date(reschedule_start);
    const endDate = new Date(reschedule_end);
    if (startDate > endDate) {
      return res.status(400).json({ ok: false, error: "Start date must be before or equal to end date" });
    }

    // Fetch current dates for log
    const { data: before, error: beforeErr } = await supabaseAdmin
      .from("bookings")
      .select("start_date, end_date")
      .eq("id", id)
      .single();
    if (beforeErr) return res.status(500).json({ ok: false, error: beforeErr.message });

    const { error: updErr } = await supabaseAdmin
      .from("bookings")
      .update({
        start_date: reschedule_start,
        end_date: reschedule_end,
      })
      .eq("id", id);
    if (updErr) return res.status(500).json({ ok: false, error: updErr.message });

    await logEvent("rescheduled", {
      from: { start: before?.start_date, end: before?.end_date },
      to: { start: reschedule_start, end: reschedule_end },
    });

    return finishAndReturn();
  }

  // ------------------------
  // 2️⃣ Mark booking as Paid
  // ------------------------
  if (mark_paid) {
    const patch: any = { status: "Paid", paid_at: new Date().toISOString() };
    const { error } = await supabaseAdmin.from("bookings").update(patch).eq("id", id);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    await logEvent("mark_paid", {});
    return finishAndReturn();
  }

  // ------------------------
  // 3️⃣ Only send reschedule email/notice
  // ------------------------
  if (reschedule_notify_only) {
    await logEvent("reschedule_notify", {});
    return res.status(200).json({ ok: true });
  }

  // ------------------------
  // 4️⃣ Approve booking
  // ------------------------
  if (status === "Approved") {
    const patch: any = { status: "Approved", approved_at: new Date().toISOString() };
    const { error } = await supabaseAdmin.from("bookings").update(patch).eq("id", id);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    await logEvent("approved", {});
    return finishAndReturn();
  }

  // ------------------------
  // 5️⃣ Close (Finished or Cancelled)
  // ------------------------
  if (status === "Closed") {
    const patch: any = {
      status: "Closed",
      close_outcome: close_outcome === "cancelled" ? "cancelled" : "completed",
      close_reason: close_reason ?? null,
    };
    const { error } = await supabaseAdmin.from("bookings").update(patch).eq("id", id);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    await logEvent("closed", patch);
    return finishAndReturn();
  }

  // ------------------------
  // 6️⃣ Generic status fallback
  // ------------------------
  if (typeof status === "string" && status) {
    const { error } = await supabaseAdmin.from("bookings").update({ status }).eq("id", id);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    await logEvent("status_change", { to: status });
    return finishAndReturn();
  }

  // ------------------------
  // 7️⃣ No recognized action
  // ------------------------
  return res.status(400).json({ ok: false, error: "No recognized action" });
}
