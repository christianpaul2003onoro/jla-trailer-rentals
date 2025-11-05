// pages/api/find.ts
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

type Out =
  | {
      ok: true;
      booking: {
        rental_id: string;
        status: string;
        start_date: string;
        end_date: string;
        pickup_time: string | null;
        return_time: string | null;
        delivery_requested: boolean;
        trailer: { name: string; rate_per_day: number };
      };
    }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Out>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { rental, key } = (req.body ?? {}) as { rental?: string; key?: string };
  if (!rental?.trim()) return res.status(400).json({ ok: false, error: "Rental ID required." });
  if (!key?.trim())    return res.status(400).json({ ok: false, error: "Access Key required." });

  // Hash the key the same way we did when creating the booking
  const pepper = process.env.ACCESS_PEPPER || "";
  const access_key_hash = crypto.createHash("sha256").update(String(key) + pepper).digest("hex");

  // Find the booking using rental_id + access_key_hash
  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select(
      `
      rental_id,
      status,
      start_date,
      end_date,
      pickup_time,
      return_time,
      delivery_requested,
      trailers!bookings_trailer_id_fkey ( name, rate_per_day )
    `
    )
    .eq("rental_id", rental.trim())
    .eq("access_key_hash", access_key_hash)
    .limit(1)
    .maybeSingle();

  if (error) return res.status(500).json({ ok: false, error: "Lookup failed." });
  if (!data)  return res.status(404).json({ ok: false, error: "Not found. Check your Rental ID and Key." });

  return res.status(200).json({
    ok: true,
    booking: {
      rental_id: data.rental_id,
      status: data.status,
      start_date: data.start_date,
      end_date: data.end_date,
      pickup_time: data.pickup_time,
      return_time: data.return_time,
      delivery_requested: !!data.delivery_requested,
      trailer: {
        name: data.trailers?.name ?? "Trailer",
        rate_per_day: Number(data.trailers?.rate_per_day ?? 0),
      },
    },
  });
}
