// pages/admin/bookings/[id].tsx
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "../../../components/AdminLayout";

type Row = {
  id: string;
  rental_id: string;
  status: string;
  start_date: string; // ISO
  end_date: string;   // ISO
  trailer_id?: string | null;
  trailers?: { name?: string | null } | null;
  clients?: { first_name?: string | null; last_name?: string | null; email?: string | null } | null;
};

type AvailOK = {
  ok: true;
  available: boolean;
  conflicts: Array<{ rentalId: string; startDate: string; endDate: string; status: string }>;
};
type AvailErr = { ok: false; error: string };

const card: React.CSSProperties = {
  background: "#141416",
  border: "1px solid #222",
  borderRadius: 12,
  padding: 16,
};
const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10 };
const input: React.CSSProperties = {
  flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #374151",
  background: "#0b1220", color: "#e5e7eb", outline: "none",
};
const btnPrimary: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 8, border: "1px solid #1e40af",
  background: "#2563eb", color: "#fff", fontWeight: 700, cursor: "pointer",
};

const toInputDate = (v?: string | null) => (!v ? "" : v.slice(0, 10));
const days = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);

export default function BookingDetails() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // reschedule form
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // availability state
  const [available, setAvailable] = useState<boolean | null>(null);
  const [availErr, setAvailErr] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<AvailOK["conflicts"]>([]);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requiredSpan = useMemo(() => (row ? days(toInputDate(row.start_date), toInputDate(row.end_date)) : null), [row]);
  const currentSpan = useMemo(() => (start && end ? days(start, end) : null), [start, end]);
  const spanMismatch = useMemo(() => {
    if (requiredSpan === null || currentSpan === null) return false;
    return currentSpan !== requiredSpan;
  }, [requiredSpan, currentSpan]);

  const invalidOrder = useMemo(() => {
    if (!start || !end) return false;
    return new Date(start) > new Date(end);
  }, [start, end]);

  // Load one booking from the admin list
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
        const found = (json?.rows ?? []).find((r: Row) => r.id === id) as Row | undefined;
        if (!found) {
          setErr("Booking not found.");
          setRow(null);
        } else {
          setRow(found);
          setStart(toInputDate(found.start_date));
          setEnd(toInputDate(found.end_date));
        }
      } catch (e: any) {
        setErr(e?.message || "Failed to load booking.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Auto-check availability on date change (debounced)
  useEffect(() => {
    if (!row?.trailer_id || !start || !end || invalidOrder) return;
    setAvailable(null);
    setAvailErr(null);
    setConflicts([]);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      try {
        const resp = await fetch("/api/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trailerId: row.trailer_id,
            startDate: start,
            endDate: end,
            excludeBookingId: row.id,
          }),
        });
        const json: AvailOK | AvailErr = await resp.json();
        if (!json.ok) {
          setAvailErr(json.error || "Availability check failed.");
          setAvailable(null);
          setConflicts([]);
        } else {
          setAvailable(json.available);
          setConflicts(json.conflicts);
        }
      } catch (e: any) {
        setAvailErr(e?.message || "Availability check failed.");
        setAvailable(null);
        setConflicts([]);
      }
    }, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row?.trailer_id, start, end, invalidOrder]);

  const customerName = useMemo(() => {
    if (!row?.clients) return "—";
    const f = row.clients.first_name ?? "";
    const l = row.clients.last_name ?? "";
    return `${f} ${l}`.trim() || "—";
  }, [row]);

  async function applyReschedule() {
    if (!row) return;
    setSuccessMsg(null);
    setErr(null);

    if (!start || !end) return setErr("Please select both start and end dates.");
    if (invalidOrder) return setErr("Start date must be <= end date.");
    if (spanMismatch) return setErr(`Keep the same duration (${requiredSpan!} day${requiredSpan === 1 ? "" : "s"}).`);
    if (available === false) return setErr("Selected dates conflict with existing bookings.");

    // confirm
    const ok = window.confirm(
      `Reschedule ${row.rental_id} to:\n  ${start} → ${end}\n\nNotify the customer by email and return to Bookings?`
    );
    if (!ok) return;

    setSending(true);
    try {
      const resp = await fetch(`/api/admin/bookings/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reschedule_start: start,
          reschedule_end: end,
          send_reschedule_email: true,   // ensure email is sent
        }),
      });
      const json = await resp.json();
      if (!resp.ok || !json?.ok) return setErr(json?.error || "Failed to reschedule.");

      // Optional local state update (not really needed since we navigate)
      setRow(json.row);
      setSuccessMsg("Rescheduled and customer notified.");

      // Go back to list
      router.push("/admin");
    } catch (e: any) {
      setErr(e?.message || "Network error.");
    } finally {
      setSending(false);
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
          <div style={card}>
            <div style={{ display: "grid", gap: 6 }}>
              <div><strong>Rental ID:</strong> {row.rental_id}</div>
              <div><strong>Status:</strong> {row.status}</div>
              <div>
                <strong>Customer:</strong> {customerName}{" "}
                <span style={{ color: "#9ca3af" }}>({row.clients?.email || "—"})</span>
              </div>
              <div><strong>Trailer:</strong> {row.trailers?.name || "—"}</div>
              <div><strong>Current dates:</strong> {toInputDate(row.start_date)} → {toInputDate(row.end_date)}</div>
            </div>
          </div>

          {/* Reschedule */}
          <div style={card}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Reschedule</h3>
            <p style={{ marginTop: 0, color: "#9ca3af" }}>
              Pick dates (same duration as the original). Availability checks automatically.
            </p>

            <div style={{ display: "grid", gap: 10, maxWidth: 440 }}>
              <label style={rowStyle}>
                <span style={{ width: 110, color: "#cbd5e1" }}>Start date</span>
                <input type="date" value={start} onChange={(e) => setStart(e.target.value)} style={input} />
              </label>

              <label style={rowStyle}>
                <span style={{ width: 110, color: "#cbd5e1" }}>End date</span>
                <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} style={input} />
              </label>
            </div>

            {/* Messages */}
            {invalidOrder && (
              <div style={{ color: "#f87171", marginTop: 8 }}>
                Start date must be ≤ end date.
              </div>
            )}
            {spanMismatch && (
              <div style={{ color: "#f59e0b", marginTop: 8 }}>
                Must keep the same duration ({requiredSpan} day{requiredSpan === 1 ? "" : "s"}).
              </div>
            )}
            {availErr && <div style={{ color: "#f87171", marginTop: 8 }}>{availErr}</div>}
            {available !== null && !spanMismatch && !invalidOrder && (
              <div style={{ marginTop: 8, color: available ? "#86efac" : "#f87171" }}>
                {available ? "✅ Dates are available." : `❌ Dates conflict with ${conflicts.length} booking(s).`}
              </div>
            )}
            {successMsg && <div style={{ color: "#86efac", marginTop: 10 }}>{successMsg}</div>}
            {err && !loading && <div style={{ color: "#f87171", marginTop: 10 }}>{err}</div>}

            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button
                onClick={applyReschedule}
                disabled={
                  sending ||
                  !start ||
                  !end ||
                  invalidOrder ||
                  spanMismatch ||
                  available === false
                }
                style={btnPrimary}
              >
                {sending ? "Saving…" : "Apply Reschedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
