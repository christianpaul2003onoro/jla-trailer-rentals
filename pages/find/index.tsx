// pages/find/index.tsx
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";

type Booking = {
  rental_id: string;
  status: string;
  start_date: string;
  end_date: string;
  pickup_time: string | null;
  return_time: string | null;
  delivery_requested: boolean;
  trailer: { name: string; rate_per_day: number };
};

export default function FindMyRental() {
  const [rental, setRental] = useState("");
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Booking | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const resp = await fetch("/api/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rental, key }),
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) {
        setError(json?.error || "Lookup failed.");
      } else {
        setResult(json.booking as Booking);
      }
    } catch (err: any) {
      setError(err?.message || "Network error.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: 10,
    borderRadius: 8,
    background: "#0b1220",
    color: "#e5e7eb",
    border: "1px solid #1f2937",
    colorScheme: "dark",
  };

  return (
    <>
      <Head><title>Find My Rental • JLA Trailer Rentals</title></Head>
      <Nav />

      <main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, color: "#e5e7eb" }}>
          Find My Rental
        </h1>
        <p style={{ color: "#cbd5e1", marginBottom: 16 }}>
          Enter your <strong>Rental ID</strong> and <strong>Access Key</strong> (from your confirmation).
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "#e5e7eb", fontWeight: 600 }}>Rental ID</span>
            <input value={rental} onChange={(e) => setRental(e.target.value)} placeholder="JLA-123456" style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "#e5e7eb", fontWeight: 600 }}>Access Key</span>
            <input value={key} onChange={(e) => setKey(e.target.value)} placeholder="6-digit code" style={inputStyle} />
          </label>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#2563eb",
                border: "1px solid #1e40af",
                padding: "10px 14px",
                borderRadius: 8,
                color: "white",
                fontWeight: 700,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Checking..." : "View Booking"}
            </button>
            <Link href="/fleet" style={{ border: "1px solid #334155", padding: "10px 14px", borderRadius: 8, color: "#e5e7eb" }}>
              Back to Fleet
            </Link>
          </div>

          {error && <div style={{ color: "#fca5a5" }}>{error}</div>}
        </form>

        {/* Result card */}
        {result && (
          <div
            style={{
              marginTop: 18,
              background: "#0b1220",
              border: "1px solid #1f2937",
              borderRadius: 10,
              padding: 16,
              color: "#cbd5e1",
            }}
          >
            <div style={{ color: "#e5e7eb", fontWeight: 700, marginBottom: 8 }}>
              Booking {result.rental_id} — {result.status}
            </div>
            <div>Trailer: <strong>{result.trailer.name}</strong></div>
            <div>Dates: <strong>{result.start_date}</strong> to <strong>{result.end_date}</strong></div>
            <div>Pickup Time: {result.pickup_time || "—"} | Return Time: {result.return_time || "—"}</div>
            <div>Delivery requested: {result.delivery_requested ? "Yes" : "No"}</div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
