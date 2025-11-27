// server/calendarSync.ts
import { google } from "googleapis";

const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_KEY || !CALENDAR_ID) {
  console.warn(
    "Google Calendar env vars missing (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_KEY / GOOGLE_CALENDAR_ID). Calendar sync is disabled."
  );
}

type CalendarBookingInput = {
  rentalId: string;
  trailerName: string | null;
  customerName: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  delivery?: boolean;
};

function getCalendarClient() {
  if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_KEY) {
    throw new Error("Google service account env vars not configured.");
  }

  const jwt = new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: SERVICE_ACCOUNT_KEY.replace(/\\n/g, "\n"),
    scopes: SCOPES,
  });

  return google.calendar({ version: "v3", auth: jwt });
}

function toISOStart(date: string) {
  // You can tweak time later; keeping simple for now
  return `${date}T09:00:00-05:00`;
}
function toISOEnd(date: string) {
  return `${date}T17:00:00-05:00`;
}

function buildSummary(b: CalendarBookingInput): string {
  const trailer = b.trailerName ? ` · ${b.trailerName}` : "";
  const customer = b.customerName || "Client";
  return `${customer}${trailer} · ${b.rentalId}`;
}

function buildDescription(b: CalendarBookingInput): string {
  const lines = [
    `Rental: ${b.rentalId}`,
    `Customer: ${b.customerName || "-"}`,
    `Trailer: ${b.trailerName || "-"}`,
    `Delivery requested: ${b.delivery ? "Yes" : "No"}`,
  ];
  return lines.join("\n");
}

export async function createCalendarEvent(
  booking: CalendarBookingInput
): Promise<string | null> {
  if (!CALENDAR_ID) return null;

  try {
    const calendar = getCalendarClient();
    const summary = buildSummary(booking);
    const description = buildDescription(booking);

    const resp = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary,
        description,
        start: { dateTime: toISOStart(booking.startDate) },
        end: { dateTime: toISOEnd(booking.endDate) },
      },
    });

    return resp.data.id ?? null;
  } catch (e) {
    console.error("CALENDAR_CREATE_ERROR", e);
    return null;
  }
}

export async function updateCalendarEvent(args: {
  eventId: string;
  booking: CalendarBookingInput;
}): Promise<void> {
  if (!CALENDAR_ID) return;

  try {
    const calendar = getCalendarClient();
    const { eventId, booking } = args;

    const summary = buildSummary(booking);
    const description = buildDescription(booking);

    await calendar.events.patch({
      calendarId: CALENDAR_ID,
      eventId,
      requestBody: {
        summary,
        description,
        start: { dateTime: toISOStart(booking.startDate) },
        end: { dateTime: toISOEnd(booking.endDate) },
      },
    });
  } catch (e) {
    console.error("CALENDAR_UPDATE_ERROR", e);
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  if (!CALENDAR_ID) return;

  try {
    const calendar = getCalendarClient();
    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId,
    });
  } catch (e) {
    console.error("CALENDAR_DELETE_ERROR", e);
  }
}