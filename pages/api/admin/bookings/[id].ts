// pages/api/admin/bookings/[id].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../server/adminauth";
import { Resend } from "resend";
import {
  rescheduledHTML,
  finishedHTML,
  cancelledHTML,
} from "../../../../server/emailTemplates";
import {
  updateCalendarEvent,
  deleteCalendarEvent,
} from "../../../../server/calendarSync";

type Ok = { ok: true; row?: any };
type Err = { ok: false; error: string };
type Out = Ok | Err;

const RESEND_API_KEY = process.env.RESEND_API_KEY as string | undefined;
const FROM_EMAIL =
  process.env.RESEND_FROM ||
  "JLA Trailer Rentals <no-reply@send.jlatrailers.com>";
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Explicit union type for the helper result
type JoinedRow = { row: any } | { error: string };

// helper to fetch one joined row (safe for UI to use after updates)
async function getJoinedRow(id: string): Promise<JoinedRow> {
  const { data, error } = await supabaseAdmin
    .from("bookings")
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
    if ("error" in got)
      return res.status(400).json({ ok: false, error: got.error });
    return res.status(200).json({ ok: true, row: got.row });
  }

  if (req.method === "PATCH") {
    try {
      const body = req.body || {};

      // ------------------------
      // RESCHEDULE
      // ------------------------
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
            trailers:trailers(name),
            clients:clients(first_name,last_name,email)
          `
          )
          .single();

        if (updErr || !updated) {
          return res
            .status(500)
            .json({ ok: false, error: updErr?.message || "Update failed" });
        }

        // Google Calendar: update event dates (best effort)
        try {
          const eventId = updated.calendar_event_id as
            | string
            | null
            | undefined;
          if (eventId) {
            const client = Array.isArray(updated.clients)
              ? updated.clients[0]
              : updated.clients;
            const trailer = Array.isArray(updated.trailers)
              ? updated.trailers[0]
              : updated.trailers;

            const clientName =
              [client?.first_name, client?.last_name]
                .filter(Boolean)
                .join(" ") || null;
            const trailerName = trailer?.name ?? null;

            // 🔹 NEW: match updateCalendarEvent({ eventId, booking })
            await updateCalendarEvent({
              eventId,
              booking: {
                rentalId: updated.rental_id as string,
                trailerName,
                customerName: clientName,
                startDate: updated.start_date as string,
                endDate: updated.end_date as string,
              },
            });
          }
        } catch (e) {
          console.error("CALENDAR_SYNC_RESCHEDULE_ERROR", e);
        }

        // notify customer (best effort) using the branded template
        try {
          if (resend && FROM_EMAIL) {
            const client = Array.isArray(updated.clients)
              ? updated.clients[0]
              : updated.clients;
            const trailer = Array.isArray(updated.trailers)
              ? updated.trailers[0]
              : updated.trailers;
            const to = client?.email as string | undefined;

            if (to) {
              const html = rescheduledHTML({
                firstName: client?.first_name ?? null,
                rentalId: updated.rental_id,
                trailerName: trailer?.name ?? null,
                // These two fields are required by the Common type; not used in the template body
                startDateISO: updated.start_date,
                endDateISO: updated.end_date,
                newStartISO: updated.start_date,
                newEndISO: updated.end_date,
              });

              await resend.emails.send({
                from: FROM_EMAIL,
                to,
                subject: `Updated dates — ${updated.rental_id}`,
                html,
              });
            }
          }
        } catch {
          /* ignore email errors */
        }

        return res.status(200).json({ ok: true, row: updated });
      }

      // ------------------------
      // CLOSE (Finished / Cancelled), with optional emails
      // ------------------------
      if (body.status === "Closed") {
        const toUpdate: any = {
          status: "Closed",
          close_outcome: body.close_outcome ?? null, // "completed" | "cancelled"
          close_reason: body.close_reason ?? null,
        };

        const { data: updated, error: updErr } = await supabaseAdmin
          .from("bookings")
          .update(toUpdate)
          .eq("id", id)
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
            trailers:trailers(name),
            clients:clients(first_name,last_name,email)
          `
          )
          .single();

        if (updErr || !updated) {
          return res
            .status(500)
            .json({ ok: false, error: updErr?.message || "Update failed" });
        }

        // Google Calendar: delete event + clear pointer (best effort)
        try {
          const eventId = updated.calendar_event_id as
            | string
            | null
            | undefined;
          if (eventId) {
            try {
              await deleteCalendarEvent(eventId);
            } catch (inner) {
              console.error("CALENDAR_SYNC_DELETE_ERROR", inner);
            }
            // clear the stored ID even if the API delete failed (event may already be gone)
            await supabaseAdmin
              .from("bookings")
              .update({ calendar_event_id: null })
              .eq("id", id);
          }
        } catch (e) {
          console.error("CALENDAR_SYNC_CLOSE_ERROR", e);
        }

        // emails (best effort), using the split templates
        try {
          if (resend && FROM_EMAIL) {
            const client = Array.isArray(updated.clients)
              ? updated.clients[0]
              : updated.clients;
            const trailer = Array.isArray(updated.trailers)
              ? updated.trailers[0]
              : updated.trailers;
            const to = client?.email as string | undefined;

            // Finished: send “Thank you” email only if checkbox requested
            if (to && updated.close_outcome === "completed" && body.send_thank_you) {
              const html = finishedHTML({
                firstName: client?.first_name ?? null,
                rentalId: updated.rental_id,
                trailerName: trailer?.name ?? null,
                startDateISO: updated.start_date,
                endDateISO: updated.end_date,
              });

              await resend.emails.send({
                from: FROM_EMAIL,
                to,
                subject: `Thank you — ${updated.rental_id} completed`,
                html,
              });
            }

            // Cancelled: send cancellation email only if checkbox requested
            if (to && updated.close_outcome === "cancelled" && body.send_cancel_email) {
              const html = cancelledHTML({
                firstName: client?.first_name ?? null,
                rentalId: updated.rental_id,
                trailerName: trailer?.name ?? null,
                startDateISO: updated.start_date,
                endDateISO: updated.end_date,
                reason: updated.close_reason ?? null,
              });

              await resend.emails.send({
                from: FROM_EMAIL,
                to,
                subject: `Booking cancelled — ${updated.rental_id}`,
                html,
              });
            }
          }
        } catch {
          /* ignore email errors */
        }

        return res.status(200).json({ ok: true, row: updated });
      }

      // Fallback – nothing matched
      return res.status(400).json({ ok: false, error: "Invalid PATCH body." });
    } catch (e: any) {
      return res
        .status(500)
        .json({ ok: false, error: e?.message || "Server error" });
    }
  }

  res.setHeader("Allow", "GET,PATCH");
  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
