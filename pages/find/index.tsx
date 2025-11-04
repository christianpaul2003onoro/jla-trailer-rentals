// pages/find/index.tsx
// Simple form → redirects to /book/view?rid=...&key=...

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import Nav from "../../components/Nav";       // <-- fixed: ../../
import Footer from "../../components/Footer"; // <-- fixed: ../../

export default function FindPage() {
  const router = useRouter();

  // form state
  const [rid, setRid] = useState("");
  const [key, setKey] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!rid.trim()) { setErr("Missing rental ID."); return; }
    if (!key.trim()) { setErr("Missing access key."); return; }

    setBusy(true);
    const params = new URLSearchParams({ rid: rid.trim(), key: key.trim() });
    router.push(`/book/view?${params.toString()}`);
  }

  const inputStyle: React.CSSProperties = {
    padding: 10, borderRadius: 8, background: "#0b1220",
    color: "#e5e7eb", border: "1px solid #1f2937"
  };

  return (
    <>
      <Head><title>Find My Rental • JLA Trailer Rentals</title></Head>
      <Nav />

      <main style={{ maxWidth: 640, margin: "32px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: "#e5e7eb", marginBottom: 12 }}>
          Find My Rental
        </h1>
        <p style={{ color: "#cbd5e1", marginBottom: 18 }}>
          Enter your <strong>Rental ID</strong> and <strong>Access Key</strong> to view your booking.
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "#e5e7eb", fontWeight: 600 }}>Rental ID</span>
            <input
              value={rid}
              onChange={(e) => setRid(e.target.value)}
              placeholder="e.g., JLA-123456"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "#e5e7eb", fontWeight: 600 }}>Access Key</span>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="6-digit key"
              style={inputStyle}
            />
          </label>

          {err && (
            <div style={{
              background: "#1e293b", border: "1px solid #dc2626",
              color: "#fecaca", padding: 10, borderRadius: 8
            }}>
              {err}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="submit"
              disabled={busy}
              style={{
                background: "#2563eb", border: "1px solid #1e40af",
                padding: "10px 14px", borderRadius: 8, color: "white",
                fontWeight: 700, opacity: busy ? 0.7 : 1
              }}
            >
              {busy ? "Checking..." : "View Booking"}
            </button>

            <Link
              href="/"
              style={{ border: "1px solid #334155", padding: "10px 14px", borderRadius: 8, color: "#e5e7eb" }}
            >
              Home
            </Link>
          </div>
        </form>
      </main>

      <Footer />
    </>
  );
}
