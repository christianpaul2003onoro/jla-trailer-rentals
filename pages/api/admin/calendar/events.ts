// pages/api/admin/calendar/events.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../server/adminauth";

type ApiOut =
  | { ok: true; events: AdminCalendarEvent[] }
  | { ok: false; error: string };

type AdminCalendarEvent = {
  id: string;
  rental_id: string;
  status: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  customerName: string;
  trailerName: string | null;
  trailerColorHex: string | null;
  delivery_requested: boolean;
};

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOut>
) {
  if (!requireAdmin(req, res)) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const daysBack = Number(req.query.daysBack ?? 30);
    const daysForward = Number(req.query.daysForward ?? 60);

    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - daysBack);

    const to = new Date(today);
    to.setDate(today.getDate() + daysForward);

    const fromStr = toDateOnly(from);
    const toStr = toDateOnly(to);

    // Grab bookings that overlap the window
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
        trailers:trailers ( name, color_hex ),
        clients:clients ( first_name, last_name )
      `
      )
      .lte("start_date", toStr)
      .gte("end_date", fromStr)
      .order("start_date", { ascending: true });

    if (error) {
      console.error("[AdminCalendar] Supabase error:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    const events: AdminCalendarEvent[] = (data ?? []).map((row: any) => {
      const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;
      const trailer = Array.isArray(row.trailers) ? row.trailers[0] : row.trailers;

      const customerName =
        [client?.first_name, client?.last_name].filter(Boolean).join(" ") ||
        "Client";

      return {
        id: row.id,
        rental_id: row.rental_id,
        status: row.status,
        start_date: row.start_date,
        end_date: row.end_date,
        customerName,
        trailerName: trailer?.name ?? null,
        trailerColorHex: trailer?.color_hex ?? null,
        delivery_requested: !!row.delivery_requested,
      };
    });

    return res.status(200).json({ ok: true, events });
  } catch (e: any) {
    console.error("[AdminCalendar] Handler error:", e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || "Server error" });
  }
}
