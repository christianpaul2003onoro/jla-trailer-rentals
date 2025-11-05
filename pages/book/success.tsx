// pages/book/success.tsx
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";

type Creds = { rental: string; key: string; name?: string; email?: string };

export default function BookingSuccess() {
  const router = useRouter();
  const [creds, setCreds] = useState<Creds | null>(null);

  useEffect(() => {
    // 1) Prefer query params
    const qRental = typeof router.query.rental === "string" ? router.query.rental : "";
    const qKey    = typeof router.query.key === "string" ? router.query.key : "";
    const qName   = typeof router.query.name === "string" ? router.query.name : "";
    const qEmail  = typeof router.query.email === "string" ? router.query.email : "";

    if (qRental && qKey) {
      const v = { rental: qRental, key: qKey, name: qName, email: qEmail };
      setCreds(v);
      // cache for refresh
      if (typeof window !== "undefined") {
        sessionStorage.setItem("jla_last_rental", JSON.stringify(v));
      }
      return;
    }

    // 2) Fallback: sessionStorage (handles hard refresh)
    try {
      const raw = sessionStorage.getItem("jla_last_rental");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.rental && parsed?.key) setCreds(parsed);
      }
    } catch {}
  }, [router.query]);

  const findUrl = creds
    ? `/find?rental=${encodeURIComponent(creds.rental)}&key=${encodeURIComponent(creds.key)}`
    : "/find";

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); } catch {}
  }

  return (
    <>
      <Head><title>Booking Received • JLA Trailer Rentals</title></Head>
      <Nav />

      <main className="container" style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 10, color: "#e5e7eb" }}>
          Thanks{creds?.name ? `, ${creds.name}` : ", there"}!
        </h1>

        <p style={{ color: "#cbd5e1", marginBottom: 16, lineHeight: 1.6 }}>
          We’ve received your booking request. We’ll send a confirmation to{" "}
          <strong>{creds?.email || "your email"}</strong> after review.
          That email will include your <strong>Rental ID</strong> and <strong>Access Key</strong>.
          You can also view your booking details anytime using <em>Find My Rental</em>.
        </p>

        {/* Credentials Card */}
        <div
          style={{
            background: "#0b1220",
            border: "1px solid #1f2937",
            borderRadius: 12,
            padding: 16,
            marginBottom: 18,
          }}
        >
          <div style={{ fontWeight: 700, color: "#e5e7eb", marginBottom: 10 }}>
            Your booking credentials
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#cbd5e1" }}>
              <span>Rental ID:</span>
              <strong>{creds?.rental || "—"}</strong>
              {creds?.rental && (
                <button
                  type="button"
                  onClick={() => copy(creds.rental)}
                  style={{
                    marginLeft: "auto",
                    border: "1px solid #334155",
                    color: "#e5e7eb",
                    background: "transparent",
                    padding: "6px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Copy
                </button>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#cbd5e1" }}>
              <span>Access Key:</span>
              <strong>{creds?.key || "—"}</strong>
              {creds?.key && (
                <button
                  type="button"
                  onClick={() => copy(creds.key)}
                  style={{
                    marginLeft: "auto",
                    border: "1px solid #334155",
                    color: "#e5e7eb",
                    background: "transparent",
                    padding: "6px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Copy
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Link
            href={findUrl}
            style={{
              background: "#2563eb",
              color: "white",
              padding: "10px 14px",
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
              padding: "10px 14px",
              borderRadius: 8,
              color: "#e5e7eb",
            }}
          >
            Back to Fleet
          </Link>
        </div>

        <p style={{ color: "#94a3b8", marginTop: 16 }}>
          Save your credentials—your Rental ID and Access Key let you check status, dates, and details anytime.
        </p>
      </main>

      <Footer />
    </>
  );
}
