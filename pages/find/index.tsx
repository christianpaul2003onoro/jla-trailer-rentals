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
      if (!resp.ok || !json.ok) setError(json?.error || "Lookup failed.");
      else setResult(json.booking as Booking);
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

      {/* Centered section */}
      <main
        style={{
          maxWidth: 600,
          margin: "60px auto",
          padding: "0 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 10, color: "#e5e7eb" }}>
          Find My Rental
        </h1>
        <p style={{ color: "#cbd5e1", marginBottom: 24 }}>
          Enter your <strong>Rental ID</strong> and <strong>Access Key</strong> (from your confirmation).
        </p>

        <form
          onSubmit={onSubmit}
          style={{ display: "grid", gap: 12, width: "100%", maxWidth: 420 }}
        >
          <label style={{ display: "grid", gap: 6, textAlign: "left" }}>
            <span style={{ color: "#e5e7eb", fontWeight: 600 }}>Rental ID</span>
            <input
              value={rental}
              onChange={(e) => setRental(e.target.value)}
              placeholder="JLA-123456"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "grid", gap: 6, textAlign: "left" }}>
            <span style={{ color: "#e5e7eb", fontWeight: 600 }}>Access Key</span>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="6-digit code"
              style={inputStyle}
            />
          </label>

          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 6 }}>
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

          {error && <div style={{ color: "#fca5a5", marginTop: 8 }}>{error}</div>}
        </form>

        {result && (
          <div
            style={{
              marginTop: 26,
              background: "#0b1220",
              border: "1px solid #1f2937",
              borderRadius: 10,
              padding: 20,
              width: "100%",
              textAlign: "left",
            }}
          >
            <div style={{ color: "#e5e7eb", fontWeight: 700, marginBottom: 6 }}>
              Booking {result.rental_id} — {result.status}
            </div>
            <div style={{ color: "#cbd5e1" }}>Trailer: <strong>{result.trailer.name}</strong></div>
            <div style={{ color: "#cbd5e1" }}>
              Dates:{" "}
              {new Date(result.start_date).toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              })}{" "}
              →{" "}
              {new Date(result.end_date).toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              })}
            </div>

            <div style={{ color: "#cbd5e1" }}>
              Pickup: {result.pickup_time || "—"} | Return: {result.return_time || "—"}
            </div>
            <div style={{ color: "#cbd5e1" }}>
              Delivery requested: {result.delivery_requested ? "Yes" : "No"}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
