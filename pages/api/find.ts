// pages/api/find.ts
// Look up a booking by Rental ID + Access Key (hashed), return joined client/trailer data.

import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "../../lib/supabaseAdmin";
import crypto from "crypto";

// explain: small helper to hash the 6-digit key the same way we stored it.
function hash(key: string) {
  const pepper = process.env.ACCESS_PEPPER || "";
  return crypto.createHash("sha256").update((key || "") + pepper).digest("hex");
}

type Ok = {
  ok: true;
  data: {
    rentalId: string;
    startDate: string;
    endDate: string;
    pickupTime: string | null;
    returnTime: string | null;
    status: string;
    deliveryRequested: boolean;
    client: {
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      phone: string | null;
      towingVehicle: string | null;
    };
    trailer: {
      id: string | null;
      name: string | null;
      ratePerDay: number | null;
    };
  };
};

type Err = { ok: false; error: string };

function hashAccessKey(key: string) {
  const pepper = process.env.ACCESS_PEPPER || "";
  return crypto.createHash("sha256").update((key || "") + pepper).digest("hex");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Err>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  const { rentalId, accessKey } = req.body || {};
  if (!rentalId || !accessKey) {
    return res
      .status(400)
      .json({ ok: false, error: "Missing rentalId or accessKey." });
  }

  // Fetch booking + joined client & trailer
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select(
      `
      rental_id,
      start_date,
      end_date,
      pickup_time,
      return_time,
      status,
      delivery_requested,
      access_key_hash,
      clients (
        first_name,
        last_name,
        email,
        phone,
        towing_vehicle
      ),
      trailers (
        id,
        name,
        rate_per_day
      )
    `
    )
    .eq("rental_id", rentalId)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
  if (!data) {
    return res.status(404).json({ ok: false, error: "Booking not found." });
  }

  // Verify access key (hash must match)
  const providedHash = hashAccessKey(String(accessKey));
  const storedHash = String((data as any).access_key_hash || "");
  if (!storedHash || storedHash !== providedHash) {
    return res.status(401).json({ ok: false, error: "Invalid access key." });
  }

  // Safely unwrap possible array/object/null returns from Supabase
  const c: any = (data as any).clients;
  const tRaw: any = (data as any).trailers;
  const t: any =
    tRaw && Array.isArray(tRaw) ? (tRaw[0] ?? null) : tRaw ?? null;

  const out: Ok["data"] = {
    rentalId: String((data as any).rental_id),
    startDate: String((data as any).start_date),
    endDate: String((data as any).end_date),
    pickupTime:
      (data as any).pickup_time != null ? String((data as any).pickup_time) : null,
    returnTime:
      (data as any).return_time != null ? String((data as any).return_time) : null,
    status: String((data as any).status),
    deliveryRequested: !!(data as any).delivery_requested,
    client: {
      firstName: c?.first_name ?? null,
      lastName: c?.last_name ?? null,
      email: c?.email ?? null,
      phone: c?.phone ?? null,
      towingVehicle: c?.towing_vehicle ?? null,
    },
    trailer: {
      id: t?.id != null ? String(t.id) : null,
      name: t?.name != null ? String(t.name) : null,
      ratePerDay:
        t?.rate_per_day != null ? Number(t.rate_per_day) : null,
    },
  };

  return res.status(200).json({ ok: true, data: out });
}
