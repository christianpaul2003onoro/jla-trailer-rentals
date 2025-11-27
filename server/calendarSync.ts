// server/calendarSync.ts
import { google } from "googleapis";

/**
 * Normalize private key from environment:
 * Vercel stores multiline keys as \n — we must convert them.
 */
function normalizePrivateKey(key?: string) {
  if (!key) return "";
  return key.replace(/\\n/g, "\n");
}

// ---------- Load ENV Vars ----------
const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = normalizePrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY);
const calendarId = process.env.GOOGLE_CALENDAR_ID;

// ---------- Validate ----------
if (!serviceEmail) console.error("[CalendarSync] Missing GOOGLE_SERVICE_ACCOUNT_EMAIL");
if (!privateKey) console.error("[CalendarSync] Missing GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
if (!calendarId) console.error("[CalendarSync] Missing GOOGLE_CALENDAR_ID");

// ---------- Auth Client ----------
function getCalendarClient() {
  const jwt = new google.auth.JWT({
    email: serviceEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth: jwt });
}

// ========================================================
//  CREATE EVENT
// ========================================================
export async function createCalendarEventForBooking({
  rental_id,
  trailerName,
  clientName,
  startDate,
  endDate,
  delivery,
}: {
  rental_id: string;
  trailerName: string;
  clientName: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  delivery: boolean;
}) {
  try {
    const calendar = getCalendarClient();

    const event = {
      summary: `${clientName} · ${trailerName} · ${rental_id}`,
      description:
        `Booking ID: ${rental_id}\nClient: ${clientName}\nTrailer: ${trailerName}\nDelivery: ${delivery ? "Yes" : "No"}`,
      start: { date: startDate },
      end: { date: endDate },
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    const eventId = response.data.id;
    return eventId || null;
  } catch (err: any) {
    console.error("[CalendarSync] create event error:", err.response?.data || err);
    return null;
  }
}

// ========================================================
//  UPDATE EVENT
// ========================================================
export async function updateCalendarEvent({
  eventId,
  rental_id,
  trailerName,
  clientName,
  startDate,
  endDate,
  delivery,
}: {
  eventId: string;
  rental_id: string;
  trailerName: string;
  clientName: string;
  startDate: string;
  endDate: string;
  delivery: boolean;
}) {
  try {
    const calendar = getCalendarClient();

    const event = {
      summary: `${clientName} · ${trailerName} · ${rental_id}`,
      description:
        `Booking ID: ${rental_id}\nClient: ${clientName}\nTrailer: ${trailerName}\nDelivery: ${delivery ? "Yes" : "No"}`,
      start: { date: startDate },
      end: { date: endDate },
    };

    await calendar.events.update({
      calendarId,
      eventId,
      requestBody: event,
    });

    return true;
  } catch (err: any) {
    console.error("[CalendarSync] update event error:", err.response?.data || err);
    return false;
  }
}

// ========================================================
//  DELETE EVENT
// ========================================================
export async function deleteCalendarEvent(eventId: string) {
  try {
    const calendar = getCalendarClient();
    await calendar.events.delete({ calendarId, eventId });
    return true;
  } catch (err: any) {
    console.error("[CalendarSync] delete event error:", err.response?.data || err);
    return false;
  }
}
