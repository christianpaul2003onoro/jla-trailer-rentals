// pages/find.tsx
import Head from "next/head";
import { useEffect, useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

type Result = {
  rentalId: string;
  startDate: string;
  endDate: string;
  pickupTime: string | null;
  returnTime: string | null;
  status: string;
  deliveryRequested: boolean;
  client: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    towingVehicle: string | null;
  };
  trailer: {
    id: string | null;
    name: string | null;
    ratePerDay: number | null;
  };
};

export default function FindMyRental() {
  const [rentalId, setRentalId] = useState("");
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  // prefill from query
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const r = p.get("rental");
    const k = p.get("key");
    if (r) setRentalId(r);
    if (k) setKey(k);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const resp = await fetch("/api/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentalId, accessKey: key }),
      });
      const json = await resp.json();
      if (!resp.ok || !json.ok) {
        setError(json?.error || "Could not find booking.");
      } else {
        setResult(json.data as Result);
      }
    } catch (err: any) {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head><title>Find My Rental • JLA</title></Head>
      <Nav />
      <main className="container" style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Find My Rental</h1>
        <p style={{ color: "#cbd5e1", marginBottom: 16 }}>
          Enter your Rental ID and Access Key to view your booking.
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 14, maxWidth: 500 }}>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "#e5e7eb", fontWeight: 600 }}>Rental ID</span>
            <input
              value={rentalId}
              onChange={(e) => setRentalId(e.target.value)}
              placeholder="JLA-123456"
              style={{ padding: 10, borderRadius: 8, background: "#0b1220", color: "#e5e7eb", border: "1px solid #1f2937" }}
            />
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "#e5e7eb", fontWeight: 600 }}>Access Key</span>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="6-digit key"
              style={{ padding: 10, borderRadius: 8, background: "#0b1220", color: "#e5e7eb", border: "1px solid #1f2937" }}
            />
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
              }}
            >
              {loading ? "Checking…" : "View Booking"}
            </button>
            <a
              href="/"
              style={{ border: "1px solid #334155", padding: "10px 14px", borderRadius: 8, color: "#e5e7eb" }}
            >
              Home
            </a>
          </div>

          {error && (
            <div style={{ marginTop: 8, color: "#fca5a5" }}>
              {error}
            </div>
          )}
        </form>

        {result && (
          <div
            style={{
              marginTop: 24,
              background: "#0b1220",
              border: "1px solid #1f2937",
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div style={{ color: "#e5e7eb", fontWeight: 700, marginBottom: 8 }}>
              Booking • {result.rentalId} <span style={{ color: "#94a3b8" }}>({result.status})</span>
            </div>
            <div style={{ color: "#cbd5e1" }}>
              Trailer: <strong>{result.trailer.name || "—"}</strong>
            </div>
            <div style={{ color: "#cbd5e1" }}>
              Dates: <strong>{result.startDate}</strong> → <strong>{result.endDate}</strong>
            </div>
            <div style={{ color: "#cbd5e1" }}>
              Pickup/Return: <strong>{result.pickupTime || "—"}</strong> / <strong>{result.returnTime || "—"}</strong>
            </div>
            <div style={{ color: "#cbd5e1" }}>
              Delivery requested: <strong>{result.deliveryRequested ? "Yes" : "No"}</strong>
            </div>
            <hr style={{ borderColor: "#1f2937", margin: "12px 0" }} />
            <div style={{ color: "#cbd5e1" }}>
              Client: <strong>{[result.client.firstName, result.client.lastName].filter(Boolean).join(" ") || "—"}</strong>
              {" — "}
              {result.client.email || "no email"} • {result.client.phone || "no phone"}
            </div>
            <div style={{ color: "#94a3b8" }}>
              Vehicle: {result.client.towingVehicle || "—"}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
