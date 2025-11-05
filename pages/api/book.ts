// pages/api/book.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// ---- Supabase (anon) for public booking flow ----
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Ok = { ok: true; rental_id: string; access_key: string };
type Err = { ok: false; error: string; field?: string };
type Out = Ok | Err;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Out>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // We expect the *exact* field names below from the form.
  const {
    trailer_id,                  // string (uuid of trailers.id)
    start_date,                  // "YYYY-MM-DD"
    end_date,                    // "YYYY-MM-DD"
    pickup_time,                 // "HH:mm"
    return_time,                 // "HH:mm"
    delivery_requested,          // boolean
    first_name,                  // string
    last_name,                   // string
    email,                       // string
    phone,                       // string
    towing_vehicle,              // string
    comments                     // string
  } = (req.body ?? {}) as Record<string, any>;

  // ---- Basic validation (mirror the UI) ----
  function bad(field: string, msg: string, status = 400) {
    return res.status(status).json({ ok: false, error: msg, field });
  }
  if (!trailer_id)          return bad("trailer_id", "Trailer is required.");
  if (!start_date)          return bad("start_date", "Start date required.");
  if (!end_date)            return bad("end_date", "End date required.");
  if (!first_name?.trim())  return bad("first_name", "First name required.");
  if (!last_name?.trim())   return bad("last_name", "Last name required.");
  if (!email?.trim())       return bad("email", "Email required.");
  if (!phone?.trim())       return bad("phone", "Phone required.");

  const normEmail = String(email).trim().toLowerCase();
  const normFirst = String(first_name).trim();
  const normLast  = String(last_name).trim();
  const normPhone = String(phone).trim();

  // ---- GET or CREATE client (no UPSERT, avoids UNIQUE requirement) ----
  // 1) Try to find an existing client by email
  const { data: foundRows, error: selErr } = await supabase
    .from("clients")
    .select("id")
    .eq("email", normEmail)
    .limit(1);

  if (selErr) {
    console.error("CLIENT_SELECT_ERROR", selErr);
    return res.status(500).json({ ok: false, error: "Client lookup failed." });
  }

  let clientId = foundRows?.[0]?.id as string | undefined;

  // 2) If not found, insert a new client
  if (!clientId) {
    const { data: newClient, error: insErr } = await supabase
      .from("clients")
      .insert({
        email: normEmail,
        first_name: normFirst,
        last_name: normLast,
        phone: normPhone,
      })
      .select("id")
      .single();

    if (insErr || !newClient) {
      console.error("CLIENT_INSERT_ERROR", insErr);
      return res.status(500).json({
        ok: false,
        error: `Client save failed: ${insErr?.message || "unknown"}`,
      });
    }
    clientId = newClient.id;
  }

  // ---- Create booking ----
  const access_key = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  const rental_id  = "JLA-" + Math.floor(100000 + Math.random() * 900000).toString();

  const payload = {
    rental_id,
    client_id: clientId,
    trailer_id,
    start_date,                      // ensure your column type is date
    end_date,                        // ensure your column type is date
    pickup_time: pickup_time ?? null,
    return_time: return_time ?? null,
    delivery_requested: !!delivery_requested,
    towing_vehicle: towing_vehicle ?? null,
    comments: comments ?? null,
    status: "Pending",
    access_key,                      // make sure the column exists (text)
  };

  const { error: bookErr } = await supabase
    .from("bookings")
    .insert(payload);

  if (bookErr) {
    console.error("BOOKING_INSERT_ERROR", {
      message: bookErr.message,
      details: (bookErr as any).details,
      hint: (bookErr as any).hint,
      code: (bookErr as any).code,
    });
    return res
      .status(500)
      .json({ ok: false, error: `Booking insert failed: ${bookErr.message}` });
  }

  return res.status(200).json({ ok: true, rental_id, access_key });
}
