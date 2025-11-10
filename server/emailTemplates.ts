// server/emailTemplates.ts
const SITE_URL = process.env.SITE_URL || "https://jlatrailers.com";
const REVIEW_URL = process.env.REVIEW_URL || "";
const INSTAGRAM_URL = process.env.INSTAGRAM_URL || "https://instagram.com/jlatrailers";

type Common = {
  firstName?: string | null;
  rentalId: string;
  trailerName?: string | null;
  startDateISO: string; // e.g., "2025-11-28"
  endDateISO: string;   // e.g., "2025-11-29"
};

const brand = {
  bg: "#ffffff",
  text: "#0b1220",
  subtext: "#475569",
  border: "#e5e7eb",
  accent: "#22c55e",      // green
  accentDark: "#16a34a",
  headerBg: "#0b1220",
  headerText: "#e5e7eb",
  chipBg: "#e8f7ee",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

const logoUrl = `${SITE_URL}/logo.png`;

function button(href: string, label: string) {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 18px 0;">
    <tr>
      <td bgcolor="${brand.accent}" style="border-radius:10px;">
        <a href="${href}" target="_blank"
           style="display:inline-block;padding:12px 18px;color:#ffffff;text-decoration:none;font-weight:700;">
           ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

function layout(opts: {
  title: string;
  preheader?: string;
  bodyHtml: string;
}) {
  const { title, preheader = "", bodyHtml } = opts;
  return `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${title}</title>
    <style>
      /* Basic email-safe reset */
      img{border:none;outline:none;text-decoration:none;display:block;max-width:100%}
      table{border-collapse:collapse!important}
      body{margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
      a{color:${brand.accent};text-decoration:none}
    </style>
  </head>
  <body style="background:${brand.bg};color:${brand.text};font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;">
    <!-- preheader (hidden in most clients) -->
    <div style="display:none;overflow:hidden;opacity:0;color:transparent;height:0;width:0;max-height:0;max-width:0;">
      ${preheader}
    </div>

    <!-- Header -->
    <table role="presentation" width="100%" style="background:${brand.headerBg};">
      <tr>
        <td style="padding:16px 0;">
          <table role="presentation" width="600" align="center" style="width:600px;max-width:92%;margin:0 auto;">
            <tr>
              <td style="display:flex;align-items:center;gap:12px;color:${brand.headerText};">
                <img src="${logoUrl}" alt="JLA Trailer Rentals" width="44" height="44" style="border-radius:8px;background:#fff"/>
                <div style="font-size:18px;font-weight:800;">JLA Trailer Rentals</div>
              </td>
              <td align="right" style="color:${brand.headerText};font-size:12px;">Miami, FL</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Card -->
    <table role="presentation" width="100%">
      <tr>
        <td>
          <table role="presentation" width="600" align="center" style="width:600px;max-width:92%;margin:18px auto;border:1px solid ${brand.border};border-radius:14px;">
            <tr>
              <td style="padding:22px;">
                <div style="font-size:22px;font-weight:800;margin-bottom:6px;">${title}</div>
                ${bodyHtml}
                <hr style="border:none;border-top:1px solid ${brand.border};margin:22px 0 12px" />
                <div style="font-size:14px;color:${brand.subtext};">
                  To reschedule or for any issue/concern about your rental, contact us immediately—we’ll be glad to help!
                </div>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <table role="presentation" width="600" align="center" style="width:600px;max-width:92%;margin:0 auto 32px;">
            <tr>
              <td style="font-size:12px;color:${brand.subtext};text-align:center;">
                <div style="margin-bottom:8px;">
                  <a href="${INSTAGRAM_URL}" target="_blank">Instagram</a> •
                  <a href="mailto:JLAtrailerrental@gmail.com">JLAtrailerrental@gmail.com</a> •
                  <a href="tel:+17867606175">(786) 760-6175</a>
                </div>
                <div>Miami, FL • © ${new Date().getFullYear()} JLA Trailer Rentals</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/* ========== TEMPLATES ========== */

// 1) Booking received (Status: Pending)
export function bookingReceivedHTML(c: Common & { email?: string | null }) {
  const greeting = c.firstName ? `Hi ${c.firstName},` : "Hello,";
  const body = `
    <p>${greeting}</p>
    <p>We’ve received your booking request <span style="background:${brand.chipBg};padding:2px 6px;border-radius:6px;font-weight:700;">${c.rentalId}</span>.</p>
    <table role="presentation" style="font-size:14px;color:${brand.text};margin:14px 0;">
      <tr><td style="padding:4px 0;"><strong>Trailer:</strong> ${c.trailerName ?? "—"}</td></tr>
      <tr><td style="padding:4px 0;"><strong>Dates:</strong> ${fmt(c.startDateISO)} → ${fmt(c.endDateISO)}</td></tr>
    </table>
    <p>We’ll review your details and send an approval with a payment link.</p>
  `;
  return layout({
    title: `We received your booking — ${c.rentalId}`,
    preheader: `Booking received for ${fmt(c.startDateISO)} to ${fmt(c.endDateISO)}.`,
    bodyHtml: body,
  });
}

// 2) Approved (Status: Approved) + Payment link
export function bookingApprovedHTML(
  c: Common & { paymentLink: string }
) {
  const greeting = c.firstName ? `Hi ${c.firstName},` : "Hello,";
  const body = `
    <p>${greeting}</p>
    <p>Your booking <span style="background:${brand.chipBg};padding:2px 6px;border-radius:6px;font-weight:700;">${c.rentalId}</span> is approved. Please complete your payment to confirm.</p>
    <table role="presentation" style="font-size:14px;margin:14px 0;">
      <tr><td style="padding:4px 0;"><strong>Trailer:</strong> ${c.trailerName ?? "—"}</td></tr>
      <tr><td style="padding:4px 0;"><strong>Dates:</strong> ${fmt(c.startDateISO)} → ${fmt(c.endDateISO)}</td></tr>
    </table>
    ${button(c.paymentLink, "Pay & Confirm")}
    <p style="font-size:12px;color:${brand.subtext}">If you’ve already paid, you can ignore this message.</p>
  `;
  return layout({
    title: `Approved — action needed for ${c.rentalId}`,
    preheader: "Booking approved. Complete payment to confirm.",
    bodyHtml: body,
  });
}

// 3) Payment received (Status: Paid)
export function paymentReceiptHTML(c: Common) {
  const greeting = c.firstName ? `Hi ${c.firstName},` : "Hello,";
  const body = `
    <p>${greeting}</p>
    <p>Thanks! We’ve received your payment for booking <span style="background:${brand.chipBg};padding:2px 6px;border-radius:6px;font-weight:700;">${c.rentalId}</span>.</p>
    <table role="presentation" style="font-size:14px;margin:14px 0;">
      <tr><td style="padding:4px 0;"><strong>Trailer:</strong> ${c.trailerName ?? "—"}</td></tr>
      <tr><td style="padding:4px 0;"><strong>Dates:</strong> ${fmt(c.startDateISO)} → ${fmt(c.endDateISO)}</td></tr>
    </table>
    <p>We’ll reach out if we need anything else before your rental.</p>
  `;
  return layout({
    title: `Payment received — ${c.rentalId}`,
    preheader: "Your rental is confirmed.",
    bodyHtml: body,
  });
}

// 4) Rescheduled
export function rescheduledHTML(
  c: Common & { newStartISO: string; newEndISO: string }
) {
  const greeting = c.firstName ? `Hi ${c.firstName},` : "Hello,";
  const body = `
    <p>${greeting}</p>
    <p>Your booking <span style="background:${brand.chipBg};padding:2px 6px;border-radius:6px;font-weight:700;">${c.rentalId}</span> has been rescheduled.</p>
    <table role="presentation" style="font-size:14px;margin:14px 0;">
      <tr><td style="padding:4px 0;"><strong>Trailer:</strong> ${c.trailerName ?? "—"}</td></tr>
      <tr><td style="padding:4px 0;"><strong>New dates:</strong> ${fmt(c.newStartISO)} → ${fmt(c.newEndISO)}</td></tr>
    </table>
    <p>If anything looks wrong, reply to this email or call us.</p>
  `;
  return layout({
    title: `Updated dates — ${c.rentalId}`,
    preheader: `New dates: ${fmt(c.newStartISO)} → ${fmt(c.newEndISO)}`,
    bodyHtml: body,
  });
}

// 5) Closed (Finished or Cancelled)
export function closedHTML(
  c: Common & { outcome: "completed" | "cancelled" }
) {
  const greeting = c.firstName ? `Hi ${c.firstName},` : "Hello,";
  const isDone = c.outcome === "completed";
  const body = `
    <p>${greeting}</p>
    <p>Your booking <span style="background:${brand.chipBg};padding:2px 6px;border-radius:6px;font-weight:700;">${c.rentalId}</span> has been ${isDone ? "completed" : "cancelled"}.</p>
    <table role="presentation" style="font-size:14px;margin:14px 0;">
      <tr><td style="padding:4px 0;"><strong>Trailer:</strong> ${c.trailerName ?? "—"}</td></tr>
      <tr><td style="padding:4px 0;"><strong>Dates:</strong> ${fmt(c.startDateISO)} → ${fmt(c.endDateISO)}</td></tr>
    </table>
    ${isDone && REVIEW_URL ? button(REVIEW_URL, "Leave a quick review") : ""}
    <p>${isDone ? "Thank you for choosing JLA Trailer Rentals!" : "We hope to serve you in the future."}</p>
  `;
  return layout({
    title: isDone ? `Thank you — ${c.rentalId} completed` : `Booking cancelled — ${c.rentalId}`,
    preheader: isDone ? "Thanks for renting with us!" : "Your booking has been cancelled.",
    bodyHtml: body,
  });
}
