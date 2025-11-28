// pages/api/admin/calendar/sync/route.ts
// Edge Scheduled Function – runs every 30 minutes and calls the import-from-google API

export const config = {
  runtime: "edge",
  // every 30 minutes
  scheduled: "*/30 * * * *",
};

async function handler() {
  try {
    // Base URL for your site (production + preview)
    const baseUrl =
      process.env.SITE_URL || // if you set SITE_URL = https://www.jlatrailers.com
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const res = await fetch(
      `${baseUrl}/api/admin/calendar/import-from-google`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // same window you’ve been testing with manually
        body: JSON.stringify({ daysBack: 2, daysForward: 60 }),
      }
    );

    const json = await res.json().catch(() => null);

    console.log("[Cron] calendar sync run:", {
      status: res.status,
      ok: res.ok,
      json,
    });
  } catch (e) {
    console.error("[Cron] calendar sync FAILED:", e);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export default handler;
