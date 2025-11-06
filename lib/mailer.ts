// lib/mailer.ts
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY!;
export const resend = new Resend(apiKey);

export function fromAddress() {
  // Use your verified subdomain. Keep it on the verified root or subdomain.
  // Example: no-reply@send.jlatrailers.com
  return "JLA Trailers <no-reply@send.jlatrailers.com>";
}

type PaymentEmailProps = {
  firstName?: string | null;
  rentalId: string;
  trailerName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  link: string;
};

export function paymentEmailHTML(p: PaymentEmailProps) {
  const name = p.firstName ? `Hi ${p.firstName},` : "Hello,";
  return `<!doctype html>
<html>
  <body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.5;color:#111">
    <p>${name}</p>
    <p>Your rental <strong>${p.rentalId}</strong>${
      p.trailerName ? ` (${p.trailerName})` : ""
    } ${p.startDate && p.endDate ? `for <strong>${p.startDate}</strong> → <strong>${p.endDate}</strong>` : ""} has been approved.</p>
    <p>Please complete your payment using the link below:</p>
    <p><a href="${p.link}" style="background:#2563eb;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none">Pay Now</a></p>
    <p>If the button doesn’t work, copy & paste this URL:</p>
    <p><a href="${p.link}">${p.link}</a></p>
    <hr style="margin:20px 0;border:none;border-top:1px solid #eee" />
    <p>Thanks,<br/>JLA Trailers</p>
  </body>
</html>`;
}
