// pages/api/admin/calendar/index.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../server/adminauth";

type Status = "Pending" | "Approved" | "Paid" | "Closed" | "Blocked";

export type AdminCalendarEvent = {
  id: string;
  rental_id: string | null;
  start_date: string;
  end_date: string;
  status: Status;
  trailer_name: string | null;
  trailer_color_hex: string | null;
  client_name: string | null;
};

type Out =
  | { ok: true; events: AdminCalendarEvent[] }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Out>
) {
  // admin cookie
  if (!requireAdmin(req, res)) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { start, end } = req.query as { start?: string; end?: string };

  if (!start || !end) {
    return res
      .status(400)
      .json({ ok: false, error: "Missing start or end date" });
  }

  try {
    // overlap: start_date <= end AND end_date >= start
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select(
        `
        id,
        rental_id,
        status,
        start_date,
        end_date,
        trailers:trailers(name,color_hex),
        clients:clients(first_name,last_name)
      `
      )
      .lte("start_date", end)
      .gte("end_date", start);

    if (error) {
      console.error("[AdminCalendar] query error", error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    const rows = data ?? [];

    const events: AdminCalendarEvent[] = rows.map((row: any) => {
      const trailer = Array.isArray(row.trailers)
        ? row.trailers[0]
        : row.trailers;
      const client = Array.isArray(row.clients) ? row.clients[0] : row.clients;

      const clientName =
        [client?.first_name, client?.last_name].filter(Boolean).join(" ") ||
        null;

      // Treat rows without rental_id as manual blocks
      let status: Status =
        row.status === "Blocked" ? "Blocked" : (row.status as Status);
      if (!row.rental_id) status = "Blocked";

      return {
        id: row.id,
        rental_id: row.rental_id,
        start_date: row.start_date,
        end_date: row.end_date,
        status,
        trailer_name: trailer?.name ?? null,
        trailer_color_hex: trailer?.color_hex ?? null,
        client_name: clientName,
      };
    });

    return res.status(200).json({ ok: true, events });
  } catch (e: any) {
    console.error("[AdminCalendar] unexpected error", e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || "Server error" });
  }
}
