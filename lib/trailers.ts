// /lib/trailers.ts
// ----------------------------------------------------------------------------
// Read trailer cards for the Fleet page.
// - Uses anon Supabase client (RLS should allow read of active trailers).
// - Maps DB snake_case -> UI camelCase.
// - Provides optional `photoUrl` from the first trailer_photos row.
// ----------------------------------------------------------------------------

import { supabase } from "../lib/supabaseClient";

// UI shape expected by pages/fleet.tsx
export type TrailerCard = {
  id: string;
  name: string;
  ratePerDay: number;
  photoUrl?: string; // <-- add this so Fleet can show an image
};

export async function getAllTrailerCards(): Promise<TrailerCard[]> {
  // Pull trailers + nested photos (file_path + sort_order)
  const { data, error } = await supabase
    .from("trailers")
    .select("id,name,rate_per_day,active,trailer_photos(file_path,sort_order)")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error || !data) {
    console.error("getAllTrailerCards error:", error);
    return [];
  }

  return data.map((t: any) => {
    // pick first photo by sort_order (if any)
    let photoUrl: string | undefined;
    if (Array.isArray(t.trailer_photos) && t.trailer_photos.length > 0) {
      const first = [...t.trailer_photos].sort(
        (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      )[0];
      photoUrl = first?.file_path || undefined;
    }

    return {
      id: t.id,
      name: t.name,
      ratePerDay: Number(t.rate_per_day),
      photoUrl, // may be undefined; Fleet page falls back to placeholder
    };
  });
}
