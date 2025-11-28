export const config = {
  runtime: "edge",
  scheduled: "*/30 * * * *", // every 30 minutes
};

const handler = async () => {
  // IMPORTANT: Your existing logic must run inside here.
  // Example:
  const res = await fetch(
    `${process.env.SITE_URL}/api/admin/calendar/fetch-google`,
    { method: "POST", headers: { "Content-Type": "application/json" } }
  );

  const json = await res.json().catch(() => ({}));
  return new Response(JSON.stringify(json), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export default handler;
