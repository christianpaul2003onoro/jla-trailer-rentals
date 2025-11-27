// server/calendarSync.ts
import { google, type calendar_v3 } from "googleapis";
import type { GaxiosError } from "gaxios";

const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

// Log env var presence at startup (not values, for security)
console.log("[CalendarSync] Env check:", {
  hasServiceAccountEmail: !!SERVICE_ACCOUNT_EMAIL,
  hasServiceAccountKey: !!SERVICE_ACCOUNT_KEY,
  hasCalendarId: !!CALENDAR_ID,
  serviceAccountEmailLength: SERVICE_ACCOUNT_EMAIL?.length ?? 0,
  serviceAccountKeyLength: SERVICE_ACCOUNT_KEY?.length ?? 0,
});

if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_KEY || !CALENDAR_ID) {
  console.warn(
    "[CalendarSync] Google Calendar env vars missing (GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_KEY / GOOGLE_CALENDAR_ID). Calendar sync is disabled."
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

function getCalendarClient(): calendar_v3.Calendar {
  if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_KEY) {
    throw new Error("Google service account env vars not configured.");
  }

  // Replace escaped newlines with actual newlines (common when storing PEM keys in env vars)
  const formattedKey = SERVICE_ACCOUNT_KEY.replace(/\\n/g, "\n");

  console.log("[CalendarSync] Creating JWT auth with:", {
    email: SERVICE_ACCOUNT_EMAIL,
    keyStartsWith: formattedKey.substring(0, 30),
    keyEndsWith: formattedKey.substring(formattedKey.length - 30),
    keyLength: formattedKey.length,
  });

  const jwt = new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: formattedKey,
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
  console.log("[CalendarSync] createCalendarEvent called with:", {
    rentalId: booking.rentalId,
    trailerName: booking.trailerName,
    customerName: booking.customerName,
    startDate: booking.startDate,
    endDate: booking.endDate,
    delivery: booking.delivery,
  });

  if (!CALENDAR_ID) {
    console.warn("[CalendarSync] No CALENDAR_ID configured, skipping event creation");
    return null;
  }

  try {
    const calendar = getCalendarClient();
    const summary = buildSummary(booking);
    const description = buildDescription(booking);

    const requestBody = {
      summary,
      description,
      start: { dateTime: toISOStart(booking.startDate) },
      end: { dateTime: toISOEnd(booking.endDate) },
    };

    console.log("[CalendarSync] Inserting event:", {
      calendarId: CALENDAR_ID,
      requestBody,
    });

    const resp = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody,
    });

    console.log("[CalendarSync] Event created successfully:", {
      eventId: resp.data.id,
      htmlLink: resp.data.htmlLink,
      status: resp.status,
    });

    return resp.data.id ?? null;
  } catch (e) {
    // Extract detailed error information from Google API errors
    const gaxiosError = e as GaxiosError;
    const errorDetails = {
      message: gaxiosError.message,
      code: gaxiosError.code,
      status: gaxiosError.response?.status,
      statusText: gaxiosError.response?.statusText,
      data: gaxiosError.response?.data,
      errors: (gaxiosError.response?.data as Record<string, unknown>)?.error,
    };

    console.error("[CalendarSync] CALENDAR_CREATE_ERROR - Full details:", errorDetails);
    console.error("[CalendarSync] CALENDAR_CREATE_ERROR - Stack:", gaxiosError.stack);

    return null;
  }
}

export async function updateCalendarEvent(args: {
  eventId: string;
  booking: CalendarBookingInput;
}): Promise<void> {
  console.log("[CalendarSync] updateCalendarEvent called with:", {
    eventId: args.eventId,
    rentalId: args.booking.rentalId,
  });

  if (!CALENDAR_ID) {
    console.warn("[CalendarSync] No CALENDAR_ID configured, skipping event update");
    return;
  }

  try {
    const calendar = getCalendarClient();
    const { eventId, booking } = args;

    const summary = buildSummary(booking);
    const description = buildDescription(booking);

    const requestBody = {
      summary,
      description,
      start: { dateTime: toISOStart(booking.startDate) },
      end: { dateTime: toISOEnd(booking.endDate) },
    };

    console.log("[CalendarSync] Patching event:", { eventId, requestBody });

    await calendar.events.patch({
      calendarId: CALENDAR_ID,
      eventId,
      requestBody,
    });

    console.log("[CalendarSync] Event updated successfully:", { eventId });
  } catch (e) {
    const gaxiosError = e as GaxiosError;
    const errorDetails = {
      message: gaxiosError.message,
      code: gaxiosError.code,
      status: gaxiosError.response?.status,
      statusText: gaxiosError.response?.statusText,
      data: gaxiosError.response?.data,
    };

    console.error("[CalendarSync] CALENDAR_UPDATE_ERROR - Full details:", errorDetails);
    console.error("[CalendarSync] CALENDAR_UPDATE_ERROR - Stack:", gaxiosError.stack);
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  console.log("[CalendarSync] deleteCalendarEvent called with:", { eventId });

  if (!CALENDAR_ID) {
    console.warn("[CalendarSync] No CALENDAR_ID configured, skipping event deletion");
    return;
  }

  try {
    const calendar = getCalendarClient();
    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId,
    });

    console.log("[CalendarSync] Event deleted successfully:", { eventId });
  } catch (e) {
    const gaxiosError = e as GaxiosError;
    const errorDetails = {
      message: gaxiosError.message,
      code: gaxiosError.code,
      status: gaxiosError.response?.status,
      statusText: gaxiosError.response?.statusText,
      data: gaxiosError.response?.data,
    };

    console.error("[CalendarSync] CALENDAR_DELETE_ERROR - Full details:", errorDetails);
    console.error("[CalendarSync] CALENDAR_DELETE_ERROR - Stack:", gaxiosError.stack);
  }
}