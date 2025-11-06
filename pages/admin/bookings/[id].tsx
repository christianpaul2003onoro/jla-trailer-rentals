// pages/admin/bookings/[id].tsx
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../../components/AdminLayout";

type Row = {
  id: string;
  rental_id: string;
  status: string;
  start_date: string; // expected "YYYY-MM-DD" (or ISO; we will slice)
  end_date: string;   // expected "YYYY-MM-DD" (or ISO; we will slice)
  trailers?: { name?: string | null } | null;
  clients?: { first_name?: string | null; last_name?: string | null; email?: string | null } | null;
};

export default function BookingDetails() {
  const router = useRouter();
  const { id, action } = router.query as { id?: string; action?: string };

  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // local form state
  const [newStart, setNewStart] = useState<string>("");
  const [newEnd, setNewEnd] = useState<string>("");

  // Helper to ensure input="date" gets YYYY-MM-DD
  const ymd = (s?: string | null) => {
    if (!s) return "";
    // if ISO, keep only the date part
    return s.length >= 10 ? s.slice(0, 10) : s;
  };

  // Fetch all bookings and pick the one we need (keeps backend unchanged)
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const resp = await fetch("/api/admin/bookings"); // list endpoint
        if (resp.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        const json = await resp.json();
        const rows: Row[] = json?.rows ?? [];
        const found = rows.find((r) => r.id === id) ?? null;
        setRow(found);
        if (found) {
          setNewStart(ymd(found.start_date));
          setNewEnd(ymd(found.end_date));
        }
      } catch (e: any) {
        setErr(e?.message || "Failed to load booking.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Simple validation
  const canSave = useMemo(() => {
    return Boolean(newStart && newEnd && row && !saving);
  }, [newStart, newEnd, row, saving]);

  async function submitReschedule() {
    if (!row) return;
    setSaving(true);
    setErr(null);
    setOkMsg(null);
    try {
      const resp = await fetch(`/api/admin/bookings/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reschedule_start: newStart,
          reschedule_end: newEnd,
        }),
      });
      const json = await resp.json();
      if (!resp.ok || !json?.ok) {
        throw new Error(json?.error || "Reschedule failed.");
      }
      const updated: Row = json.row;
      setRow(updated);
      setOkMsg("Dates updated.");
    } catch (e: any) {
      setErr(e?.message || "Reschedule failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <Head><title>Admin • Booking</title></Head>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <Link href="/admin" style={{ border: "1px solid #333", borderRadius: 8, padding: "6px 10px", textDecoration: "none", color: "#e5e7eb" }}>
          ← Back
        </Link>
        <h1 style={{ margin: 0, fontSize: 20 }}>Booking</h1>
      </div>

      {action === "reschedule" ? (
        <div style={{ marginBottom: 8, color: "#9ca3af" }}>
          Reschedule this booking by selecting the new dates below and saving.
        </div>
      ) : (
        <div style={{ marginBottom: 8, color: "#9ca3af" }}>
          Booking details.
        </div>
      )}

      {loading && <p>Loading…</p>}
      {!loading && !row && <p style={{ color: "#f87171" }}>Booking not found.</p>}

      {!!row && (
        <div style={card}>
          {/* Booking header */}
          <div style={{ display: "grid", gap: 4, marginBottom: 12 }}>
            <div style={{ fontSize: 14, color: "#9ca3af" }}>Rental ID</div>
            <div style={{ fontWeight: 700 }}>{row.rental_id}</div>

            <div style={{ fontSize: 14, color: "#9ca3af", marginTop: 8 }}>Customer</div>
            <div>
              {row.clients?.first_name || row.clients?.last_name
                ? `${row.clients?.first_name ?? ""} ${row.clients?.last_name ?? ""}`.trim()
                : "—"}
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                {row.clients?.email || "—"}
              </div>
            </div>

            <div style={{ fontSize: 14, color: "#9ca3af", marginTop: 8 }}>Trailer</div>
            <div>{row.trailers?.name ?? "—"}</div>

            <div style={{ fontSize: 14, color: "#9ca3af", marginTop: 8 }}>Status</div>
            <div>{row.status}</div>
          </div>

          {/* Reschedule form */}
          <div style={{ borderTop: "1px solid #222", paddingTop: 12, marginTop: 8 }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>New dates</h3>

            <div style={{ display: "grid", gap: 10, maxWidth: 360 }}>
              <label style={label}>
                <span style={labelText}>Start date</span>
                <input
                  type="date"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  style={input}
                />
              </label>

              <label style={label}>
                <span style={labelText}>End date</span>
                <input
                  type="date"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  style={input}
                />
              </label>
            </div>

            {err && <div style={{ color: "#f87171", marginTop: 10 }}>{err}</div>}
            {okMsg && <div style={{ color: "#93c5fd", marginTop: 10 }}>{okMsg}</div>}

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                onClick={() => router.push("/admin")}
                style={btnGhost}
              >
                Cancel
              </button>
              <button
                disabled={!canSave}
                onClick={submitReschedule}
                style={btnPrimary}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const card: React.CSSProperties = {
  background: "#141416",
  border: "1px solid #222",
  borderRadius: 12,
  padding: 16,
  maxWidth: 720,
};

const label: React.CSSProperties = { display: "grid", gap: 6 };
const labelText: React.CSSProperties = { color: "#9ca3af", fontSize: 13 };
const input: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #374151",
  background: "#0b1220",
  color: "#e5e7eb",
  outline: "none",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #1e40af",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #374151",
  background: "transparent",
  color: "#e5e7eb",
  cursor: "pointer",
};
