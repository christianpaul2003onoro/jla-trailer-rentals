// server/calendarSync.ts
//
// Google Calendar sync for JLA Trailer Rentals.
//
// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================
//
// Required:
//   - GOOGLE_SERVICE_ACCOUNT_EMAIL : The service account email address
//   - GOOGLE_CALENDAR_ID           : The calendar ID to sync events to
//   - One of the following for the private key (checked in order):
//       1. GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY (preferred, matches common deployment naming)
//       2. GOOGLE_SERVICE_ACCOUNT_KEY          (legacy name)
//
// Optional:
//   - RENTAL_TIMEZONE          : Timezone for event display (default: 'America/New_York')
//   - RENTAL_DEFAULT_START_HOUR: Default start hour (0-23) for date-only bookings (default: 9)
//   - RENTAL_DEFAULT_END_HOUR  : Default end hour (0-23) for date-only bookings (default: 17)
//
// The private key is normalized:
//   1. Escaped '\n' sequences are replaced with actual newlines
//   2. Double-escaped '\\n' sequences are also handled
//   3. Leading/trailing whitespace is trimmed
//
// ============================================================================

import { google, type calendar_v3 } from "googleapis";
import type { GaxiosError } from "gaxios";

// Service account email
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

// Private key: check multiple env var names for resilience
const SERVICE_ACCOUNT_KEY =
  process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
  process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

// Timezone for calendar events (default: America/New_York)
const RENTAL_TIMEZONE = process.env.RENTAL_TIMEZONE || "America/New_York";

// Default hours for date-only bookings
const RENTAL_DEFAULT_START_HOUR = parseInt(process.env.RENTAL_DEFAULT_START_HOUR || "9", 10);
const RENTAL_DEFAULT_END_HOUR = parseInt(process.env.RENTAL_DEFAULT_END_HOUR || "17", 10);

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

/**
 * Normalize a PEM private key from environment variable format.
 * 
 * Environment variables may contain:
 * - Literal "\n" characters (the string backslash-n, not actual newlines)
 * - Actual newline characters
 * - Double-quoted values with escaped sequences
 * 
 * This function handles:
 * - Double-escaped sequences: literal "\\n" -> actual newline
 * - Single-escaped sequences: literal "\n" -> actual newline  
 * - Trims whitespace
 */
function normalizePrivateKey(key: string): string {
  // First pass: replace double-escaped \\n (literal backslash-backslash-n) with actual newlines
  // In JavaScript regex, \\\\ matches two literal backslashes
  let normalized = key.replace(/\\\\n/g, "\n");
  // Second pass: replace single-escaped \n (literal backslash-n) with actual newlines
  // In JavaScript regex, \\n matches a literal backslash followed by 'n'
  normalized = normalized.replace(/\\n/g, "\n");
  // Trim any leading/trailing whitespace
  return normalized.trim();
}

/**
 * Map our trailer color hex to a Google Calendar event colorId.
 * Google only supports a fixed palette (1–11), so we approximate.
 *
 * Palette reference:
 * 1 lavender, 2 sage, 3 grape, 4 flamingo, 5 banana,
 * 6 tangerine, 7 peacock, 8 graphite, 9 blueberry, 10 basil, 11 tomato
 */
function hexToEventColorId(hex?: string | null): string | undefined {
  if (!hex) return undefined;

  const normalized = hex.trim().toLowerCase();

  const mapping: Record<string, string> = {
    // blue-ish
    "#60a5fa": "9", // blueberry

    // green-ish
    "#34d399": "10", // basil

    // red-ish
    "#f87171": "11", // tomato

    // orange
    "#fb923c": "6", // tangerine

    // purple
    "#a78bfa": "3", // grape

    // yellow
    "#ffff00": "5", // banana

    // pink
    "#f472b6": "4", // flamingo
  };

  return mapping[normalized];
}




/**
 * Log startup diagnostics for the service account key (without exposing secrets).
 */
function logKeyDiagnostics(key: string | undefined, source: string): void {
  if (!key) {
    console.log("[CalendarSync] INIT: No private key found");
    return;
  }

  const normalized = normalizePrivateKey(key);
  const hasBeginMarker = normalized.includes("-----BEGIN");
  const hasEndMarker = normalized.includes("-----END");
  const hasPrivateKeyMarker = normalized.includes("PRIVATE KEY");

  console.log("[CalendarSync] INIT: Private key diagnostics:", {
    source,
    rawLength: key.length,
    normalizedLength: normalized.length,
    hasBeginMarker,
    hasEndMarker,
    hasPrivateKeyMarker,
    isValidFormat: hasBeginMarker && hasEndMarker && hasPrivateKeyMarker,
  });

  if (!hasBeginMarker || !hasEndMarker) {
    console.warn("[CalendarSync] INIT: WARNING - Private key may be malformed (missing BEGIN/END markers)");
  }
}

// Determine which env var the key came from for logging
const keySource = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  ? "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"
  : process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    ? "GOOGLE_SERVICE_ACCOUNT_KEY"
    : "none";

// Log env var presence at startup (not values, for security)
console.log("[CalendarSync] INIT: Environment check:", {
  hasServiceAccountEmail: !!SERVICE_ACCOUNT_EMAIL,
  hasServiceAccountKey: !!SERVICE_ACCOUNT_KEY,
  keyEnvVarSource: keySource,
  hasCalendarId: !!CALENDAR_ID,
  timezone: RENTAL_TIMEZONE,
  defaultStartHour: RENTAL_DEFAULT_START_HOUR,
  defaultEndHour: RENTAL_DEFAULT_END_HOUR,
});

logKeyDiagnostics(SERVICE_ACCOUNT_KEY, keySource);

if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_KEY || !CALENDAR_ID) {
  console.warn(
    "[CalendarSync] INIT: Google Calendar env vars missing. Required: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY (or GOOGLE_SERVICE_ACCOUNT_KEY), GOOGLE_CALENDAR_ID. Calendar sync is disabled."
  );
}

type CalendarBookingInput = {
  rentalId: string;
  trailerName: string | null;
  customerName: string;
  startDate: string; // "YYYY-MM-DD" or full ISO
  endDate: string;   // "YYYY-MM-DD" or full ISO
  delivery?: boolean;

  // NEW: used to keep Google event color in sync with trailer color
  trailerColorHex?: string | null;
};


/**
 * Type guard to check if an error is a GaxiosError (Google API HTTP error)
 */
function isGaxiosError(e: unknown): e is GaxiosError {
  return (
    typeof e === "object" &&
    e !== null &&
    "response" in e &&
    typeof (e as GaxiosError).message === "string"
  );
}

/**
 * Extract and log detailed error information from API errors
 */
function logCalendarError(context: string, e: unknown): void {
  if (isGaxiosError(e)) {
    const errorDetails = {
      message: e.message,
      code: e.code,
      status: e.response?.status,
      statusText: e.response?.statusText,
      data: e.response?.data,
      errors: (e.response?.data as Record<string, unknown>)?.error,
    };
    console.error(`[CalendarSync] ${context} - Full details:`, errorDetails);
    console.error(`[CalendarSync] ${context} - Stack:`, e.stack);
  } else if (e instanceof Error) {
    console.error(`[CalendarSync] ${context} - Error:`, e.message);
    console.error(`[CalendarSync] ${context} - Stack:`, e.stack);
  } else {
    console.error(`[CalendarSync] ${context} - Unknown error:`, e);
  }
}

function getCalendarClient(): calendar_v3.Calendar {
  if (!SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_KEY) {
    throw new Error(
      "[CalendarSync] ERROR: Google service account env vars not configured. " +
      "Required: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY (or GOOGLE_SERVICE_ACCOUNT_KEY)"
    );
  }

  // Normalize the private key (handles escaped newlines)
  const formattedKey = normalizePrivateKey(SERVICE_ACCOUNT_KEY);

  // Validate key format without exposing sensitive data
  const hasBeginMarker = formattedKey.includes("-----BEGIN");
  const hasEndMarker = formattedKey.includes("-----END");

  if (!hasBeginMarker || !hasEndMarker) {
    throw new Error(
      "[CalendarSync] ERROR: Private key appears malformed (missing BEGIN/END markers). " +
      "Ensure the key is a valid PEM-encoded private key."
    );
  }

  console.log("[CalendarSync] INIT: Creating JWT auth with:", {
    email: SERVICE_ACCOUNT_EMAIL,
    keyLength: formattedKey.length,
    keyHasBeginMarker: hasBeginMarker,
    keyHasEndMarker: hasEndMarker,
  });

  const jwt = new google.auth.JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: formattedKey,
    scopes: SCOPES,
  });

  return google.calendar({ version: "v3", auth: jwt });
}

/**
 * Check if a date string contains a time component (is a full timestamp).
 * Returns true for strings like "2024-01-15T17:00:00" or "2024-01-15T17:00:00-05:00"
 */
function isTimestamp(dateStr: string): boolean {
  return dateStr.includes("T");
}

/**
 * Safely parse a date/time string and extract the hour.
 * Returns the default hour if parsing fails or dateStr is not a timestamp.
 */
function parseHourFromTimestamp(dateStr: string, defaultHour: number): number {
  if (!isTimestamp(dateStr)) {
    return defaultHour;
  }
  
  // Extract time portion: "2024-01-15T17:30:00" -> "17:30:00"
  const timePart = dateStr.split("T")[1];
  if (!timePart) {
    console.warn(`[CalendarSync] WARNING: Failed to parse hour from timestamp: ${dateStr}`);
    return defaultHour;
  }
  
  const hourStr = timePart.split(":")[0];
  const hour = parseInt(hourStr, 10);
  if (isNaN(hour) || hour < 0 || hour > 23) {
    console.warn(`[CalendarSync] WARNING: Invalid hour parsed from timestamp: ${dateStr}`);
    return defaultHour;
  }
  
  return hour;
}

/**
 * Safely parse minutes from a timestamp string.
 * Returns 0 if parsing fails or dateStr is not a timestamp.
 */
function parseMinutesFromTimestamp(dateStr: string): number {
  if (!isTimestamp(dateStr)) {
    return 0;
  }
  
  const timePart = dateStr.split("T")[1];
  if (!timePart) {
    return 0;
  }
  
  const parts = timePart.split(":");
  if (parts.length < 2) {
    return 0;
  }
  
  const minutes = parseInt(parts[1], 10);
  if (isNaN(minutes) || minutes < 0 || minutes > 59) {
    return 0;
  }
  
  return minutes;
}

/**
 * Extract the date portion (YYYY-MM-DD) from a date string.
 * Works with both "2024-01-15" and "2024-01-15T17:00:00" formats.
 */
function extractDatePortion(dateStr: string): string {
  return dateStr.split("T")[0];
}

/**
 * Format a number as two digits (with leading zero if needed).
 */
function padTwo(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Build ISO datetime string for Google Calendar event start.
 * 
 * If dateStr contains a time component ('T'), uses the actual time.
 * Otherwise, uses RENTAL_DEFAULT_START_HOUR.
 * 
 * Returns object with dateTime and timeZone for Google Calendar API.
 */
function buildEventStart(dateStr: string): { dateTime: string; timeZone: string } {
  const datePortion = extractDatePortion(dateStr);
  let hour: number;
  let minutes: number;

  if (isTimestamp(dateStr)) {
    // Use actual time from timestamp
    hour = parseHourFromTimestamp(dateStr, RENTAL_DEFAULT_START_HOUR);
    minutes = parseMinutesFromTimestamp(dateStr);
  } else {
    // Date-only: use default start hour
    hour = RENTAL_DEFAULT_START_HOUR;
    minutes = 0;
  }

  // Format: YYYY-MM-DDTHH:MM:00
  const dateTime = `${datePortion}T${padTwo(hour)}:${padTwo(minutes)}:00`;
  
  return {
    dateTime,
    timeZone: RENTAL_TIMEZONE,
  };
}

/**
 * Build ISO datetime string for Google Calendar event end.
 * 
 * Logic:
 * - If startDate contains a time component, the end time uses the same hour/minute
 *   on the endDate (e.g., pickup at 5 PM -> return at 5 PM the next day).
 * - If startDate is date-only, uses RENTAL_DEFAULT_END_HOUR on the endDate.
 * 
 * Returns object with dateTime and timeZone for Google Calendar API.
 */
function buildEventEnd(startDateStr: string, endDateStr: string): { dateTime: string; timeZone: string } {
  const endDatePortion = extractDatePortion(endDateStr);
  let hour: number;
  let minutes: number;

  if (isTimestamp(startDateStr)) {
    // If start has a time, use the same time for end (e.g., 5 PM pickup -> 5 PM dropoff)
    hour = parseHourFromTimestamp(startDateStr, RENTAL_DEFAULT_END_HOUR);
    minutes = parseMinutesFromTimestamp(startDateStr);
  } else {
    // Date-only: use default end hour
    hour = RENTAL_DEFAULT_END_HOUR;
    minutes = 0;
  }

  // Format: YYYY-MM-DDTHH:MM:00
  const dateTime = `${endDatePortion}T${padTwo(hour)}:${padTwo(minutes)}:00`;
  
  return {
    dateTime,
    timeZone: RENTAL_TIMEZONE,
  };
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
  console.log("[CalendarSync] INSERT: createCalendarEvent called with:", {
    rentalId: booking.rentalId,
    trailerName: booking.trailerName,
    customerName: booking.customerName,
    startDate: booking.startDate,
    endDate: booking.endDate,
    delivery: booking.delivery,
  });

  if (!CALENDAR_ID) {
    const errorMsg = "[CalendarSync] ERROR: No CALENDAR_ID configured, cannot create event";
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }

  // Build the calendar client - this will throw if credentials are missing/invalid
  const calendar = getCalendarClient();
  const summary = buildSummary(booking);
  const description = buildDescription(booking);

  // Build event times using dynamic time logic
  const startTime = buildEventStart(booking.startDate);
  const endTime = buildEventEnd(booking.startDate, booking.endDate);

   const colorId = hexToEventColorId(booking.trailerColorHex);

  const requestBody: calendar_v3.Schema$Event = {
    summary,
    description,
    start: startTime,
    end: endTime,
    // Only set a colorId if we have a valid mapping
    ...(colorId ? { colorId } : {}),
  };


  console.log("[CalendarSync] INSERT: Inserting event:", {
    calendarId: CALENDAR_ID,
    requestBody,
    timezone: RENTAL_TIMEZONE,
  });

  try {
    const resp = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody,
    });

    console.log("[CalendarSync] INSERT: Event created successfully:", {
      eventId: resp.data.id,
      htmlLink: resp.data.htmlLink,
      status: resp.status,
    });

    return resp.data.id ?? null;
  } catch (e) {
    logCalendarError("INSERT ERROR", e);
    // Re-throw to let caller handle and surface the error
    throw e;
  }
}

export async function updateCalendarEvent(args: {
  eventId: string;
  booking: CalendarBookingInput;
}): Promise<void> {
  console.log("[CalendarSync] PATCH: updateCalendarEvent called with:", {
    eventId: args.eventId,
    rentalId: args.booking.rentalId,
  });

  if (!CALENDAR_ID) {
    const errorMsg = "[CalendarSync] ERROR: No CALENDAR_ID configured, cannot update event";
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }

  const calendar = getCalendarClient();
  const { eventId, booking } = args;

  const summary = buildSummary(booking);
  const description = buildDescription(booking);

  // Build event times using dynamic time logic
  const startTime = buildEventStart(booking.startDate);
  const endTime = buildEventEnd(booking.startDate, booking.endDate);

    const colorId = hexToEventColorId(booking.trailerColorHex);

  const requestBody: calendar_v3.Schema$Event = {
    summary,
    description,
    start: startTime,
    end: endTime,
    ...(colorId ? { colorId } : {}),
  };


  console.log("[CalendarSync] PATCH: Patching event:", { 
    eventId, 
    requestBody,
    timezone: RENTAL_TIMEZONE,
  });

  try {
    await calendar.events.patch({
      calendarId: CALENDAR_ID,
      eventId,
      requestBody,
    });

    console.log("[CalendarSync] PATCH: Event updated successfully:", { eventId });
  } catch (e) {
    logCalendarError("PATCH ERROR", e);
    throw e;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  console.log("[CalendarSync] DELETE: deleteCalendarEvent called with:", { eventId });

  if (!CALENDAR_ID) {
    const errorMsg = "[CalendarSync] ERROR: No CALENDAR_ID configured, cannot delete event";
    console.warn(errorMsg);
    throw new Error(errorMsg);
  }

  const calendar = getCalendarClient();
  
  try {
    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId,
    });

    console.log("[CalendarSync] DELETE: Event deleted successfully:", { eventId });
  } catch (e) {
    logCalendarError("DELETE ERROR", e);
    throw e;
  }
}

// ---------------------------------------------------------------------------
// LIST EVENTS (for Google → Supabase import)
// ---------------------------------------------------------------------------

export type RawCalendarEvent = calendar_v3.Schema$Event;

export async function listCalendarEvents(params: {
  timeMinISO: string; // e.g. new Date().toISOString()
  timeMaxISO: string;
  maxResults?: number;
}): Promise<RawCalendarEvent[]> {
  if (!CALENDAR_ID) {
    throw new Error(
      "[CalendarSync] ERROR: No CALENDAR_ID configured, cannot list events"
    );
  }

  const calendar = getCalendarClient();

  const { timeMinISO, timeMaxISO, maxResults } = params;

  console.log("[CalendarSync] LIST: Fetching events from Google Calendar", {
    calendarId: CALENDAR_ID,
    timeMinISO,
    timeMaxISO,
    maxResults: maxResults ?? 250,
  });

  try {
    const resp = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: timeMinISO,
      timeMax: timeMaxISO,
      singleEvents: true,
      orderBy: "startTime",
      maxResults: maxResults ?? 250,
    });

    const items = resp.data.items ?? [];
    console.log("[CalendarSync] LIST: Retrieved events:", {
      count: items.length,
    });

    return items;
  } catch (e) {
    logCalendarError("LIST ERROR", e);
    throw e;
  }
}
