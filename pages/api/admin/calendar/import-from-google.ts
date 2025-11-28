// pages/api/admin/calendar/import-from-google.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { requireAdmin } from "../../../../server/adminauth";
import {
  listCalendarEvents,
  type RawCalendarEvent,
} from "../../../../server/calendarSync";
import crypto from "crypto";

type Out =
  | { ok: true; created: number; skippedExisting: number; ignored: number }
  | { ok: false; error: string };

// Same pepper used in /api/book.ts
const ACCESS_PEPPER = process.env.ACCESS_PEPPER || "";

/** Generate a JLA-###### rental id */
function generateRentalId(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `JLA-${n}`;
}

/** Generate a random 6-digit access key and its SHA-256 hash */
function generateAccessKeyHash() {
  const accessKey = Math.floor(100000 + Math.random() * 900000).toString();
  const hash = crypto
    .createHash("sha256")
    .update(accessKey + ACCESS_PEPPER)
    .digest("hex");
  return { accessKey, hash };
}

/** Very simple human name splitter → first / last */
function splitName(full: string): { first: string; last: string } {
  const trimmed = full.trim();
  if (!trimmed) return { first: "Client", last: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return {
    first: parts.slice(0, -1).join(" "),
    last: parts[parts.length - 1],
  };
}

/** Normalize an imported email; ensure we always have something unique */
function normalizeImportedEmail(
  raw: string | undefined,
  rentalId: string,
  eventId: string
): string {
  const v = (raw || "").trim().toLowerCase();
  if (!v || v === "none" || v === "n/a" || v === "na") {
    // Safe, unique placeholder domain
    return `no-email+${rentalId}-${eventId}@local.jla`;
  }
  return v;
}

/** Parse "Key=Value" lines from description into a map */
function parseDescriptionKV(desc: string | undefined) {
  const map: Record<string, string> = {};
  if (!desc) return map;

  desc
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line) => {
      const idx = line.indexOf("=");
      if (idx === -1) return;
      const key = line.slice(0, idx).trim().toLowerCase();
      const value = line.slice(idx + 1).trim();
      if (key) map[key] = value;
    });

  return map;
}

/** Extract date portion (YYYY-MM-DD) from ISO or date-only string */
function extractDate(dateLike: string | undefined | null): string | null {
  if (!dateLike) return null;
  return dateLike.split("T")[0] || null;
}

/** Try to parse a Google event into our "phone booking" shape. */
function parseEventToBookingInput(ev: RawCalendarEvent) {
  const title = (ev.summary || "").trim();
  if (!title) return null;

  // Expect "Client Name - Trailer Name"
  const m = title.match(/^(.*?)\s*-\s*(.+)$/);
  if (!m) {
    // Not in the booking pattern → ignore for now (no blocks yet)
    return null;
  }

  const customerName = m[1].trim();
  const trailerLabel = m[2].trim();

  const descMap = parseDescriptionKV(ev.description || "");

  const phone = descMap["phone"] || "";
  const rawEmail = descMap["email"] || "";
  const deliveryRaw = (descMap["delivery"] || "").toLowerCase();
  const notes = descMap["notes"] || "";

  const deliveryRequested =
    deliveryRaw === "yes" ||
    deliveryRaw === "y" ||
    deliveryRaw === "true" ||
    deliveryRaw === "si" ||
    deliveryRaw === "sí";

  const start =
    ev.start?.dateTime || ev.start?.date || null;
  const end =
    ev.end?.dateTime || ev.end?.date || null;

  const startDate = extractDate(start);
  const endDate = extractDate(end);

  if (!startDate || !endDate) {
    console.warn("[CalendarImport] Missing start/end date for event", {
      eventId: ev.id,
      summary: ev.summary,
    });
    return null;
  }

  return {
    customerName,
    trailerLabel,
    phone,
    rawEmail,
    deliveryRequested,
    notes,
    startDate,
    endDate,
  };
}

/** Find a trailer by matching the label against trailer.name (case-insensitive, substring) */
function findTrailerIdForLabel(
  trailers: { id: string; name: string | null }[],
  label: string
): string | null {
  const normLabel = label.trim().toLowerCase();
  if (!normLabel) return null;

  // Exact (case-insensitive) match first
  const exact = trailers.find(
    (t) => (t.name || "").trim().toLowerCase() === normLabel
  );
  if (exact) return exact.id;

  // Then substring match
  const partial = trailers.find((t) =>
    (t.name || "").toLowerCase().includes(normLabel)
  );
  return partial ? partial.id : null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Out>
) {
  // Admin-only route
  if (!requireAdmin(req, res)) return;

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed. Use POST." });
  }

  try {
    // Optional body: { daysBack, daysForward }
    const { daysBack = 1, daysForward = 60 } = (req.body ??
      {}) as {
      daysBack?: number;
      daysForward?: number;
    };

    const now = new Date();
    const tMin = new Date(now);
    tMin.setDate(tMin.getDate() - daysBack);
    const tMax = new Date(now);
    tMax.setDate(tMax.getDate() + daysForward);

    const timeMinISO = tMin.toISOString();
    const timeMaxISO = tMax.toISOString();

    // 1) Load calendar events
    const events = await listCalendarEvents({
      timeMinISO,
      timeMaxISO,
    });

    const eventIds = events
      .map((e) => e.id)
      .filter((id): id is string => !!id);

    if (!eventIds.length) {
      return res.status(200).json({
        ok: true,
        created: 0,
        skippedExisting: 0,
        ignored: 0,
      });
    }

    // 2) Find which event ids are already linked to bookings
    const { data: existingBookings, error: existingErr } = await supabaseAdmin
      .from("bookings")
      .select("calendar_event_id")
      .in("calendar_event_id", eventIds);

    if (existingErr) {
      console.error("[CalendarImport] Failed to fetch existing bookings", existingErr);
      return res
        .status(500)
        .json({ ok: false, error: "Failed to check existing bookings" });
    }

    const alreadyLinked = new Set(
      (existingBookings ?? [])
        .map((b) => b.calendar_event_id)
        .filter((id: string | null) => !!id) as string[]
    );

    // 3) Preload trailers once
    const { data: trailers, error: trErr } = await supabaseAdmin
      .from("trailers")
      .select("id,name");

    if (trErr || !trailers) {
      console.error("[CalendarImport] Failed to load trailers", trErr);
      return res
        .status(500)
        .json({ ok: false, error: "Failed to load trailers" });
    }

    let created = 0;
    let skippedExisting = 0;
    let ignored = 0;

    for (const ev of events) {
      const eventId = ev.id;
      if (!eventId) {
        ignored++;
        continue;
      }

      if (alreadyLinked.has(eventId)) {
        skippedExisting++;
        continue;
      }

      const parsed = parseEventToBookingInput(ev);
      if (!parsed) {
        // Not in booking format (for now, ignore; later: treat as manual block)
        ignored++;
        continue;
      }

      const trailerId = findTrailerIdForLabel(trailers, parsed.trailerLabel);
      if (!trailerId) {
        console.warn("[CalendarImport] Could not match trailer", {
          eventId,
          summary: ev.summary,
          trailerLabel: parsed.trailerLabel,
        });
        ignored++;
        continue;
      }

      const rentalId = generateRentalId();
      const { hash: access_key_hash } = generateAccessKeyHash();
      const normEmail = normalizeImportedEmail(
        parsed.rawEmail,
        rentalId,
        eventId
      );

      const { first, last } = splitName(parsed.customerName);

      // 3a) Find or create client by email
      let clientId: string | null = null;

      const { data: foundClient, error: selErr } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("email", normEmail)
        .limit(1);

      if (!selErr && foundClient && foundClient.length > 0) {
        clientId = foundClient[0].id;
      } else {
        const { data: newClient, error: insErr } = await supabaseAdmin
          .from("clients")
          .insert({
            email: normEmail,
            first_name: first,
            last_name: last,
            phone: parsed.phone || null,
            towing_vehicle: null,
            comments: parsed.notes || null,
          })
          .select("id")
          .single();

        if (insErr || !newClient) {
          console.error("[CalendarImport] Failed to create client", insErr);
          // We still *can* create a booking with null client_id, but better to know
          clientId = null;
        } else {
          clientId = newClient.id;
        }
      }

      // 3b) Create booking with status "Pending"
      const { error: bookErr } = await supabaseAdmin.from("bookings").insert({
        rental_id: rentalId,
        trailer_id: trailerId,
        client_id: clientId,
        start_date: parsed.startDate,
        end_date: parsed.endDate,
        pickup_time: null,
        return_time: null,
        delivery_requested: parsed.deliveryRequested,
        status: "Pending",
        access_key_hash,
        calendar_event_id: eventId,
      });

      if (bookErr) {
        console.error("[CalendarImport] Failed to create booking", {
          eventId,
          rentalId,
          error: bookErr,
        });
        ignored++;
        continue;
      }

      created++;
      alreadyLinked.add(eventId);
    }

    return res.status(200).json({
      ok: true,
      created,
      skippedExisting,
      ignored,
    });
  } catch (e: any) {
    console.error("[CalendarImport] Fatal error", e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || "Server error" });
  }
}
