// pages/book/view.tsx
// Booking lookup UI that calls /api/find and renders details.
// Uses ONLY relative imports and keeps "no client cancel" policy.

import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";

type Found = {
  rentalId: string;
  status: string;
  startDate: string;
  endDate: string;
  pickupTime?: string | null;
  returnTime?: string | null;
  deliveryRequested: boolean;
  trailer: { id?: string | null; name?: string | null; ratePerDay?: number | null };
  client: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    towingVehicle?: string | null;
  };
};

export default function ViewBookingPage() {
  // form inputs
  const [rentalId, setRentalId] = useState("");
  const [accessKey, setAccessKey] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [found, setFound] = useState<Found | null>(null);

  async function onLookup(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setFound(null);
    if (!rentalId.trim() || !accessKey.trim()) {
      setErr("Enter both Rental ID and Access Key.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentalId: rentalId.trim(), accessKey: accessKey.trim() }),
      });
      const json = await resp.json();
      if (!resp.ok || !json?.ok) {
        setErr(json?.error || "Could not find booking.");
      } else {
        setFound(json.data as Found);
      }
    } catch (e: any) {
      setErr("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head><title>Find My Rental • JLA Trailer Rentals</title></Head>
      <Nav />

      <main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, marginBottom: 12, color: "#e5e7eb" }}>
          Find My Rental
        </h1>

        <form onSubmit={onLookup} style={{ display: "grid", gap: 12, maxWidth: 640 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Rental ID</span>
            <input
              placeholder="e.g., JLA-123456"
              value={rentalId}
              onChange={(e) => setRentalId(e.target.value)}
              style={input()}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Access Key</span>
            <input
              placeholder="6-digit key from confirmation"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              style={input()}
            />
          </label>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#2563eb", border: "1px solid #1e40af",
                padding: "10px 14px", borderRadius: 8, color: "white", fontWeight: 700
              }}
            >
              {loading ? "Checking…" : "View Booking"}
            </button>
            <Link href="/" style={{ padding: "10px 14px" }}>Home</Link>
          </div>

          {err && (
            <div style={alert("error")}>{err}</div>
          )}
        </form>

        {/* result */}
        {found && (
          <section style={{ marginTop: 24 }}>
            <div style={card()}>
              <h2 style={{ margin: "0 0 10px 0" }}>
                Rental <strong>{found.rentalId}</strong> — {found.status}
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Info label="Trailer" value={found.trailer.name || "—"} />
                <Info label="Daily rate" value={found.trailer.ratePerDay ? `$${found.trailer.ratePerDay}` : "—"} />
                <Info label="Start date" value={found.startDate} />
                <Info label="End date" value={found.endDate} />
                <Info label="Pickup time" value={found.pickupTime || "—"} />
                <Info label="Return time" value={found.returnTime || "—"} />
                <Info label="Delivery requested" value={found.deliveryRequested ? "Yes" : "No"} />
                <Info label="Towing vehicle" value={found.client.towingVehicle || "—"} />
                <Info label="Client name" value={`${found.client.firstName ?? ""} ${found.client.lastName ?? ""}`.trim() || "—"} />
                <Info label="Email" value={found.client.email || "—"} />
                <Info label="Phone" value={found.client.phone || "—"} />
              </div>

              {/* No customer cancellation. Only a contact option. */}
              <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                <a
                  href={`mailto:jlatrailerrentals@gmail.com?subject=Rental%20${encodeURIComponent(found.rentalId)}%20-%20Change%20Request`}
                  style={{ border: "1px solid #334155", padding: "8px 12px", borderRadius: 8 }}
                >
                  Request a change by email
                </a>
                <button
                  onClick={() => window.print()}
                  style={{ border: "1px solid #334155", padding: "8px 12px", borderRadius: 8 }}
                >
                  Print
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}

function input(): React.CSSProperties {
  return {
    padding: 10, borderRadius: 8, background: "#0b1220",
    color: "#e5e7eb", border: "1px solid #1f2937", colorScheme: "dark",
  };
}
function alert(kind: "error" | "info"): React.CSSProperties {
  return {
    marginTop: 12,
    background: kind === "error" ? "#3b0d0d" : "#0b2e13",
    border: `1px solid ${kind === "error" ? "#7f1d1d" : "#14532d"}`,
    color: "#e5e7eb",
    padding: 10, borderRadius: 8,
  };
}
function card(): React.CSSProperties {
  return { background: "#0b1220", border: "1px solid #1f2937", borderRadius: 10, padding: 16 };
}
function Info(props: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <div style={{ color: "#94a3b8", fontSize: 12 }}>{props.label}</div>
      <div style={{ color: "#e5e7eb", fontWeight: 600 }}>{props.value}</div>
    </div>
  );
}
