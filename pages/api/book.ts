// pages/api/book.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

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

  // Expect these field names from the form
  const {
    trailer_id,                  // uuid
    start_date,                  // "YYYY-MM-DD" (date col)
    end_date,                    // "YYYY-MM-DD" (date col)
    pickup_time,                 // "HH:mm" or ""
    return_time,                 // "HH:mm" or ""
    delivery_requested,          // boolean
    first_name,
    last_name,
    email,
    phone,
    towing_vehicle,
    comments,
  } = (req.body ?? {}) as Record<string, any>;

  const bad = (field: string, msg: string, status = 400) =>
    res.status(status).json({ ok: false, error: msg, field });

  // Basic validation
  if (!trailer_id)         return bad("trailer_id", "Trailer is required.");
  if (!start_date)         return bad("start_date", "Start date required.");
  if (!end_date)           return bad("end_date", "End date required.");
  if (!first_name?.trim()) return bad("first_name", "First name required.");
  if (!last_name?.trim())  return bad("last_name", "Last name required.");
  if (!email?.trim())      return bad("email", "Email required.");
  if (!phone?.trim())      return bad("phone", "Phone required.");

  const normEmail = String(email).trim().toLowerCase();
  const normFirst = String(first_name).trim();
  const normLast  = String(last_name).trim();
  const normPhone = String(phone).trim();

  // --- GET or CREATE client (service role bypasses RLS) ---
  const { data: found, error: selErr } = await supabaseAdmin
    .from("clients")
    .select("id")
    .eq("email", normEmail)
    .limit(1);

  if (selErr) {
    console.error("CLIENT_SELECT_ERROR", selErr);
    return res.status(500).json({ ok: false, error: "Client lookup failed." });
  }

  let clientId = found?.[0]?.id as string | undefined;

  if (!clientId) {
    const { data: newClient, error: insErr } = await supabaseAdmin
      .from("clients")
      .insert({
        email: normEmail,
        first_name: normFirst,
        last_name: normLast,
        phone: normPhone,
        towing_vehicle: towing_vehicle ?? null,
        comments: comments ?? null,
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
  } else {
    // Optional: keep client info fresh
    await supabaseAdmin
      .from("clients")
      .update({
        first_name: normFirst,
        last_name: normLast,
        phone: normPhone,
        towing_vehicle: towing_vehicle ?? null,
        comments: comments ?? null,
      })
      .eq("id", clientId);
  }

  // --- Create booking ---
  const access_key = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
  const pepper = process.env.ACCESS_PEPPER || "";
  const access_key_hash = crypto
    .createHash("sha256")
    .update(access_key + pepper)
    .digest("hex");

  const rental_id = "JLA-" + Math.floor(100000 + Math.random() * 900000).toString();

  const { error: bookErr } = await supabaseAdmin
    .from("bookings")
    .insert({
      rental_id,
      trailer_id,
      client_id: clientId,
      start_date,                      // date column
      end_date,                        // date column
      pickup_time: pickup_time || null,
      return_time: return_time || null,
      delivery_requested: !!delivery_requested,
      status: "Pending",               // enum booking_status('Pending',...)
      access_key_hash,                 // <-- matches your table
    });

  if (bookErr) {
    console.error("BOOKING_INSERT_ERROR", {
      message: bookErr.message,
      details: (bookErr as any).details,
      hint: (bookErr as any).hint,
      code: (bookErr as any).code,
    });
    return res.status(500).json({ ok: false, error: `Booking insert failed: ${bookErr.message}` });
  }

  return res.status(200).json({ ok: true, rental_id, access_key });
}
