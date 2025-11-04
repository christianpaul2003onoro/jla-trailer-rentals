// pages/api/book.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// ---- Supabase (anon) for public booking flow ----
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

type Out =
  | { ok: true; rental_id: string; access_key: string }
  | { ok: false; error: string; field?: string };

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

  // ---- Upsert client (by email) ----
  const { data: clientRow, error: clientErr } = await supabase
    .from("clients")
    .upsert(
      {
        email: String(email).trim().toLowerCase(),
        first_name: String(first_name).trim(),
        last_name: String(last_name).trim(),
        phone: String(phone).trim(),
      },
      { onConflict: "email", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (clientErr || !clientRow) {
    return res
      .status(500)
      .json({ ok: false, error: `Client save failed: ${clientErr?.message || "unknown"}` });
  }

  // ---- Create booking ----
  const access_key = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  // rental_id can be generated in DB (trigger) or here; we'll do it here:
  const rental_id = "JLA-" + Math.floor(100000 + Math.random() * 900000).toString();

  const { error: bookErr } = await supabase.from("bookings").insert({
    rental_id,
    client_id: clientRow.id,
    trailer_id,
    start_date,
    end_date,
    pickup_time: pickup_time ?? null,
    return_time: return_time ?? null,
    delivery_requested: !!delivery_requested,
    towing_vehicle: towing_vehicle ?? null,
    comments: comments ?? null,
    status: "Pending",
    access_key,
  });

  if (bookErr) {
    // Typical causes if you see this:
    // - RLS policy denies insert
    // - NOT NULL / type mismatch in table
    return res
      .status(500)
      .json({ ok: false, error: `Booking insert failed: ${bookErr.message}` });
  }

  return res.status(200).json({ ok: true, rental_id, access_key });
}
