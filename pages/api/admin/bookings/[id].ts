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

  if (!requireAdmin(req, res)) return;

  const id = req.query.id as string;
  if (!id) return res.status(400).json({ ok: false, error: "Missing id" });

  const {
    status,
    mark_paid,
    close_outcome,        // "completed" | "cancelled"
    close_reason,
    reschedule_notify_only
  } = req.body || {};

  // helper: write an event (ignore failure)
  async function logEvent(kind: string, details: Record<string, any>) {
    await supabaseAdmin.from("booking_events").insert({ booking_id: id, kind, details }).then(() => {}, () => {});
  }

  if (mark_paid) {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({ status: "Paid" })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    await logEvent("mark_paid", {});
    return res.status(200).json({ ok: true, row: data });
  }

  if (reschedule_notify_only) {
    await logEvent("reschedule_notify", {});
    return res.status(200).json({ ok: true });
  }

  if (status === "Approved") {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({ status: "Approved" })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    await logEvent("approved", {});
    return res.status(200).json({ ok: true, row: data });
  }

  if (status === "Closed") {
    const patch: any = {
      status: "Closed",
      close_outcome: close_outcome === "cancelled" ? "cancelled" : "completed",
      close_reason: close_reason ?? null,
    };
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    await logEvent("closed", patch);
    return res.status(200).json({ ok: true, row: data });
  }

  if (status) {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return res.status(500).json({ ok: false, error: error.message });
    await logEvent("status_change", { to: status });
    return res.status(200).json({ ok: true, row: data });
  }

  return res.status(400).json({ ok: false, error: "No recognized action" });
}
