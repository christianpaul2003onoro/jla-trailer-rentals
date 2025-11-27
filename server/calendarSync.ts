// server/calendarSync.ts
// Google Calendar helper for JLA bookings.
// - createCalendarEventForBooking: when a booking is Approved
// - updateCalendarEvent: when a booking is rescheduled
// - deleteCalendarEvent: when a booking is cancelled/closed (optional)

import { google } from "googleapis";

const SA_JSON = process.env.GOOGLE_SERVICE_ACCOUNT;
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
const TIMEZONE = process.env.GOOGLE_CALENDAR_TIMEZONE || "America/New_York";

type ServiceAccountCreds = {
  client_email: string;
  private_key: string;
};

function getCalendarClient() {
  if (!SA_JSON || !CALENDAR_ID) {
    console.warn(
      "[calendarSync] Missing GOOGLE_SERVICE_ACCOUNT or GOOGLE_CALENDAR_ID – skipping sync."
    );
    return null;
  }

  let creds: ServiceAccountCreds;
  try {
    creds = JSON.parse(SA_JSON);
  } catch (e) {
    console.error(
      "[calendarSync] Failed to parse GOOGLE_SERVICE_ACCOUNT JSON",
      e
    );
    return null;
  }

  const jwt = new google.auth.JWT(
    creds.client_email,
    undefined,
    creds.private_key,
    ["https://www.googleapis.com/auth/calendar"]
  );

  const calendar = google.calendar({ version: "v3", auth: jwt });
  return { calendar, calendarId: CALENDAR_ID, timezone: TIMEZONE };
}

export type CalendarBookingPayload = {
  rentalId: string;
  trailerName: string | null;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  customerName: string;
};

function addOneDay(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function buildEventBody(booking: CalendarBookingPayload, timezone: string) {
  const titleParts = [
    booking.customerName || "Customer",
    booking.trailerName || "Trailer",
    booking.rentalId,
  ];
  const summary = titleParts.join(" · ");

  const descriptionLines = [
    `Rental: ${booking.rentalId}`,
    booking.trailerName ? `Trailer: ${booking.trailerName}` : "",
    `Customer: ${booking.customerName}`,
    "",
    "Created automatically from JLA website.",
  ].filter(Boolean);

  return {
    summary,
    description: descriptionLines.join("\n"),
    start: {
      date: booking.startDate,
      timeZone: timezone,
    },
    end: {
      // Google Calendar all-day end.date is exclusive
      date: addOneDay(booking.endDate),
      timeZone: timezone,
    },
  };
}

/**
 * Create a calendar event when a booking is approved.
 * Returns the Google event ID or null (we ignore this for now).
 */
export async function createCalendarEventForBooking(
  booking: CalendarBookingPayload
): Promise<string | null> {
  const client = getCalendarClient();
  if (!client) return null;

  const { calendar, calendarId, timezone } = client;
  const eventBody = buildEventBody(booking, timezone);

  try {
    const resp = await calendar.events.insert({
      calendarId,
      requestBody: eventBody,
    });
    const eventId = resp.data.id ?? null;
    console.log("[calendarSync] Event created for", booking.rentalId, eventId);
    return eventId;
  } catch (e) {
    console.error("[calendarSync] Failed to create event", e);
    return null;
  }
}

/**
 * Update an existing event for reschedule.
 * If eventId is missing, it will create a new event instead.
 * Returns the event ID (existing or newly created) or null on failure.
 */
export async function updateCalendarEvent(opts: {
  eventId?: string | null;
  booking: CalendarBookingPayload;
}): Promise<string | null> {
  const client = getCalendarClient();
  if (!client) return null;

  const { calendar, calendarId, timezone } = client;
  const eventBody = buildEventBody(opts.booking, timezone);

  try {
    if (opts.eventId) {
      const resp = await calendar.events.patch({
        calendarId,
        eventId: opts.eventId,
        requestBody: eventBody,
      });
      const id = resp.data.id ?? opts.eventId;
      console.log(
        "[calendarSync] Event updated for",
        opts.booking.rentalId,
        id
      );
      return id;
    } else {
      // no stored event id → create a fresh one
      const resp = await calendar.events.insert({
        calendarId,
        requestBody: eventBody,
      });
      const id = resp.data.id ?? null;
      console.log(
        "[calendarSync] Event created (no previous id) for",
        opts.booking.rentalId,
        id
      );
      return id;
    }
  } catch (e) {
    console.error("[calendarSync] Failed to update event", e);
    return null;
  }
}

/**
 * Delete an event when a booking is cancelled/closed.
 * Safe to call with undefined/null eventId (it will just no-op).
 */
export async function deleteCalendarEvent(
  eventId?: string | null
): Promise<void> {
  const client = getCalendarClient();
  if (!client) return;

  if (!eventId) {
    console.warn("[calendarSync] deleteCalendarEvent called with no eventId");
    return;
  }

  const { calendar, calendarId } = client;
  try {
    await calendar.events.delete({
      calendarId,
      eventId,
    });
    console.log("[calendarSync] Event deleted", eventId);
  } catch (e) {
    console.error("[calendarSync] Failed to delete event", e);
  }
}
