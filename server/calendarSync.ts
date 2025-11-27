// server/calendarSync.ts
// Simple helper: create an all-day Google Calendar event when a booking is approved.

import { google } from "googleapis";

const SA_JSON = process.env.GOOGLE_SERVICE_ACCOUNT;
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
const TIMEZONE = process.env.GOOGLE_CALENDAR_TIMEZONE || "America/New_York";

function getCalendarClient() {
  if (!SA_JSON || !CALENDAR_ID) {
    console.warn(
      "[calendarSync] Missing GOOGLE_SERVICE_ACCOUNT or GOOGLE_CALENDAR_ID – skipping sync."
    );
    return null;
  }

  let creds: { client_email: string; private_key: string };
  try {
    creds = JSON.parse(SA_JSON);
  } catch (e) {
    console.error("[calendarSync] Failed to parse GOOGLE_SERVICE_ACCOUNT JSON", e);
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
  endDate: string;   // "YYYY-MM-DD"
  customerName: string;
};

function addOneDay(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function createCalendarEventForBooking(
  booking: CalendarBookingPayload
): Promise<void> {
  const client = getCalendarClient();
  if (!client) return; // silently skip if misconfigured

  const { calendar, calendarId, timezone } = client;

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
    "Created automatically from JLA website (status: Approved).",
  ].filter(Boolean);

  // All-day event: Google uses end.date as exclusive, so add 1 day
  const event = {
    summary,
    description: descriptionLines.join("\n"),
    start: {
      date: booking.startDate,
      timeZone: timezone,
    },
    end: {
      date: addOneDay(booking.endDate),
      timeZone: timezone,
    },
  };

  try {
    await calendar.events.insert({
      calendarId,
      requestBody: event,
    });
    console.log("[calendarSync] Event created for", booking.rentalId);
  } catch (e) {
    console.error("[calendarSync] Failed to create event", e);
  }
}
