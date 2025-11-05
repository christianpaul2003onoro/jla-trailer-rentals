// pages/book/success.tsx
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";

type Creds = { rental: string; key: string; name?: string; email?: string };

export default function BookingSuccess() {
  const [creds, setCreds] = useState<Creds | null>(null);

  useEffect(() => {
    // 1) Parse query from the URL (avoids Next.js router timing)
    try {
      const qs = new URLSearchParams(window.location.search);
      const rental = qs.get("rental") || "";
      const key    = qs.get("key") || "";
      const name   = qs.get("name") || "";
      const email  = qs.get("email") || "";

      if (rental && key) {
        const v = { rental, key, name, email };
        setCreds(v);
        sessionStorage.setItem("jla_last_rental", JSON.stringify(v));
        return;
      }
    } catch { /* ignore */ }

    // 2) Fallback: sessionStorage (covers refresh)
    try {
      const raw = sessionStorage.getItem("jla_last_rental");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.rental && parsed?.key) {
          setCreds(parsed);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const findUrl = creds
    ? `/find?rental=${encodeURIComponent(creds.rental)}&key=${encodeURIComponent(creds.key)}`
    : "/find";

  return (
    <>
      <Head><title>Booking Confirmation • JLA Trailer Rentals</title></Head>
      <Nav />

      <main className="container" style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 10, color: "#e5e7eb" }}>
          Thanks{creds?.name ? `, ${creds.name}` : ", there"}!
        </h1>

        <p style={{ color: "#cbd5e1", marginBottom: 20, lineHeight: 1.6 }}>
          We’ve received your booking! A confirmation email was sent to{" "}
          <strong>{creds?.email || "your email"}</strong> along with your{" "}
          <strong>Rental ID</strong> and <strong>Access Key</strong>.<br />
          You’ll hear from us once your request is approved.
        </p>

        <div
          style={{
            background: "#0b1220",
            border: "1px solid #1f2937",
            borderRadius: 12,
            padding: 18,
            marginBottom: 20,
          }}
        >
          <div style={{ fontWeight: 700, color: "#e5e7eb", marginBottom: 10, fontSize: 16 }}>
            Your booking credentials
          </div>

          <div style={{ display: "grid", gap: 10, color: "#cbd5e1" }}>
            <div><span>Rental ID: </span><strong>{creds?.rental || "—"}</strong></div>
            <div><span>Access Key: </span><strong>{creds?.key || "—"}</strong></div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href={findUrl}
            style={{
              background: "#2563eb",
              color: "white",
              padding: "10px 16px",
              borderRadius: 8,
              fontWeight: 700,
            }}
          >
            Open “Find My Rental”
          </Link>
          <Link
            href="/fleet"
            style={{
              border: "1px solid #334155",
              padding: "10px 16px",
              borderRadius: 8,
              color: "#e5e7eb",
              fontWeight: 500,
            }}
          >
            Back to Fleet
          </Link>
        </div>

        <p style={{ color: "#94a3b8", marginTop: 16 }}>
          Use these credentials in <em>Find My Rental</em> to check your booking status, dates, and details anytime.
        </p>
      </main>

      <Footer />
    </>
  );
}
