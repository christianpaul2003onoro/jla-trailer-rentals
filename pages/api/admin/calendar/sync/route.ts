// app/api/admin/calendar/sync/route.ts
// Scheduled job: call the import-from-google endpoint once per day

import { NextResponse } from "next/server";

export const config = {
  runtime: "edge",
  // CRON in UTC. This example = every day at 06:00 UTC.
  // Change it if you want another time.
  scheduled: "0 6 * * *",
};

export async function GET() {
  const base = (process.env.SITE_URL || "https://www.jlatrailers.com").replace(/\/$/, "");
  const url = `${base}/api/admin/calendar/import-from-google`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Same window you were using in the console
      body: JSON.stringify({ daysBack: 2, daysForward: 60, source: "cron" }),
    });

    const json = await res.json().catch(() => ({}));

    // Log a bit for Vercel
    console.log("[CronSync] Finished import-from-google", {
      status: res.status,
      created: json?.created,
      skippedExisting: json?.skippedExisting,
      ignored: json?.ignored,
    });

    return NextResponse.json(
      {
        ok: true,
        cron: true,
        status: res.status,
        result: json,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[CronSync] ERROR calling import-from-google:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Cron sync failed" },
      { status: 500 }
    );
  }
}
