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
  start_date: string; // ISO
  end_date: string;   // ISO
  trailers?: { name?: string | null } | null;
  clients?: { first_name?: string | null; last_name?: string | null; email?: string | null } | null;
};

function toInputDate(v?: string | null) {
  if (!v) return "";
  // ensure YYYY-MM-DD for <input type="date">
  return v.slice(0, 10);
}

export default function BookingDetails() {
  const router = useRouter();
  const { id, action } = router.query as { id?: string; action?: string };

  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // form state (reschedule)
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [sending, setSending] = useState(false);
  const [noteOnlySending, setNoteOnlySending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load the booking by reading the admin list and filtering by id (no extra GET route required)
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const resp = await fetch("/api/admin/bookings");
        if (resp.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        const json = await resp.json();
        const found = (json?.rows ?? []).find((r: Row) => r.id === id) || null;
        setRow(found);
        if (found) {
          setStart(toInputDate(found.start_date));
          setEnd(toInputDate(found.end_date));
        } else {
          setErr("Booking not found.");
        }
      } catch (e: any) {
        setErr(e?.message || "Failed to load booking.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const customerName = useMemo(() => {
    if (!row?.clients) return "—";
    const f = row.clients.first_name ?? "";
    const l = row.clients.last_name ?? "";
    const full = `${f} ${l}`.trim();
    return full || "—";
  }, [row]);

  async function applyReschedule() {
    if (!row) return;
    setSuccessMsg(null);
    setErr(null);

    // Simple client guards
    if (!start || !end) {
      setErr("Please select both start and end dates.");
      return;
    }
    if (new Date(start) > new Date(end)) {
      setErr("Start date must be before or equal to end date.");
      return;
    }

    setSending(true);
    try {
      const resp = await fetch(`/api/admin/bookings/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reschedule_start: start, // YYYY-MM-DD
          reschedule_end: end,     // YYYY-MM-DD
        }),
      });
      const json = await resp.json();
      if (!resp.ok || !json?.ok) {
        setErr(json?.error || "Failed to reschedule.");
      } else {
        setRow(json.row);
        setStart(toInputDate(json.row?.start_date));
        setEnd(toInputDate(json.row?.end_date));
        setSuccessMsg("Dates updated successfully.");
      }
    } catch (e: any) {
      setErr(e?.message || "Network error.");
    } finally {
      setSending(false);
    }
  }

  async function notifyOnly() {
    if (!row) return;
    setSuccessMsg(null);
    setErr(null);
    setNoteOnlySending(true);
    try {
      const resp = await fetch(`/api/admin/bookings/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reschedule_notify_only: true }),
      });
      const json = await resp.json();
      if (!resp.ok || json?.ok === false) {
        setErr(json?.error || "Failed to send reschedule notice.");
      } else {
        setSuccessMsg("Reschedule notice sent.");
      }
    } catch (e: any) {
      setErr(e?.message || "Network error.");
    } finally {
      setNoteOnlySending(false);
    }
  }

  return (
    <AdminLayout>
      <Head><title>Admin • Booking</title></Head>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <Link href="/admin" style={{ border: "1px solid #333", borderRadius: 8, padding: "6px 10px", textDecoration: "none", color: "#eaeaea" }}>
          ← Back
        </Link>
        <h1 style={{ margin: 0, fontSize: 20 }}>Booking</h1>
      </div>

      {loading && <p>Loading…</p>}
      {err && <p style={{ color: "#f87171" }}>{err}</p>}
      {!loading && !row && !err && <p>Not found.</p>}

      {row && (
        <div style={{ display: "grid", gap: 16 }}>
          {/* Summary card */}
          <div style={card}>
            <div style={{ display: "grid", gap: 6 }}>
              <div><strong>Rental ID:</strong> {row.rental_id}</div>
              <div><strong>Status:</strong> {row.status}</div>
              <div><strong>Customer:</strong> {customerName} <span style={{ color: "#9ca3af" }}>({row.clients?.email || "—"})</span></div>
              <div><strong>Trailer:</strong> {row.trailers?.name || "—"}</div>
              <div><strong>Current dates:</strong> {toInputDate(row.start_date)} → {toInputDate(row.end_date)}</div>
            </div>
          </div>

          {/* Reschedule flow */}
          <div style={card}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Reschedule</h3>
            <p style={{ marginTop: 0, color: "#9ca3af" }}>
              {action === "reschedule"
                ? "Select new dates and apply. You can also send a reschedule notice only (no date change)."
                : "Select new dates and click Apply Reschedule."}
            </p>

            <div style={{ display: "grid", gap: 10, maxWidth: 440 }}>
              <label style={rowStyle}>
                <span style={{ width: 110, color: "#cbd5e1" }}>Start date</span>
                <input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  style={input}
                />
              </label>

              <label style={rowStyle}>
                <span style={{ width: 110, color: "#cbd5e1" }}>End date</span>
                <input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  style={input}
                />
              </label>
            </div>

            {successMsg && <div style={{ color: "#86efac", marginTop: 10 }}>{successMsg}</div>}
            {err && !loading && <div style={{ color: "#f87171", marginTop: 10 }}>{err}</div>}

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={applyReschedule} disabled={sending} style={btnPrimary}>
                {sending ? "Saving…" : "Apply Reschedule"}
              </button>
              <button onClick={notifyOnly} disabled={noteOnlySending} style={btnGhost}>
                {noteOnlySending ? "Sending…" : "Send Reschedule Notice Only"}
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
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const input: React.CSSProperties = {
  flex: 1,
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
