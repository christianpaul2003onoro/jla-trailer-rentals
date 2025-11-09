// pages/admin/index.tsx
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import AdminLayout from "../../components/AdminLayout";
import StatusPill from "../../components/StatusPill";
import ApproveModal from "../../components/ApproveModal";

type Status = "Pending" | "Approved" | "Paid" | "Closed" | "Rejected";

type Row = {
  id: string;
  rental_id: string;
  status: Status;
  start_date: string;
  end_date: string;
  delivery_requested: boolean;
  created_at: string;
  paid_at?: string | null;
  payment_link?: string | null;
  trailers?: { name?: string } | null;
  clients?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
};

function fmtLocal(dt?: string | null) {
  if (!dt) return "";
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt ?? "";
  }
}

export default function AdminHome() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  // Close modal
  const [closing, setClosing] = useState<null | Row>(null);
  const [outcome, setOutcome] = useState<"completed" | "cancelled" | "reschedule">("completed");
  const [reason, setReason] = useState("");
  const [sendThankYou, setSendThankYou] = useState(false);
  const [sendCancelEmail, setSendCancelEmail] = useState(true);
  const [sendRescheduleEmail, setSendRescheduleEmail] = useState(true);

  // Approve + payment link modal
  const [approveFor, setApproveFor] = useState<null | Row>(null);

  async function refreshRows() {
    setLoading(true);
    try {
      const resp = await fetch("/api/admin/bookings", { credentials: "include" });
      if (resp.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const json = await resp.json();
      if (!resp.ok || json?.ok === false) {
        alert(json?.error || "Failed to load bookings.");
        setRows([]);
      } else {
        setRows(json?.rows ?? []);
      }
    } catch (e: any) {
      alert(e?.message || "Network error while loading bookings.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshRows();
  }, []);

  useEffect(() => {
    const onFocus = () => refreshRows();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  async function patchStatus(id: string, body: Record<string, any>) {
    const resp = await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (resp.status === 401) {
      window.location.href = "/admin/login";
      return false;
    }

    const json = await resp.json();

    if (!resp.ok || json?.ok === false) {
      alert(json?.error || "Could not update status.");
      return false;
    }

    if (json?.row) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                ...json.row,
                clients: json.row.clients ?? r.clients,
                trailers: json.row.trailers ?? r.trailers,
              }
            : r
        )
      );
      return true;
    }

    await refreshRows();
    return true;
  }

  // Mark Paid with confirmation
  async function markPaid(row: Row) {
    if (!row?.rental_id) {
      alert("Missing rental ID.");
      return;
    }

    const name =
      (row.clients?.first_name || row.clients?.last_name)
        ? `${row.clients?.first_name ?? ""} ${row.clients?.last_name ?? ""}`.trim()
        : "customer";
    const email = row.clients?.email ?? "no-email";

    const ok = window.confirm(
      `Confirm marking ${row.rental_id} as Paid and sending a receipt to:\n\n` +
      `${name} <${email}>\n\nPress OK to proceed or Cancel to abort.`
    );
    if (!ok) return;

    try {
      const resp = await fetch("/api/admin/bookings/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rental_id: row.rental_id }),
      });
      const json = await resp.json().catch(() => ({} as any));

      if (!resp.ok || json?.ok === false) {
        alert(json?.error || "Failed to mark paid.");
        return;
      }

      // optimistic status + timestamp
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id ? { ...r, status: "Paid", paid_at: new Date().toISOString() } : r
        )
      );

      alert(json.emailed ? "Marked as paid. Receipt email sent." : "Marked as paid.");
    } catch (e: any) {
      alert(e?.message || "Network error.");
    }
  }

  function openCloseModal(row: Row, preset: "completed" | "cancelled" | "reschedule") {
    setClosing(row);
    setOutcome(preset);
    setReason("");
    setSendThankYou(false);
    setSendCancelEmail(true);
    setSendRescheduleEmail(true);
  }

  function startReschedule(row: Row) {
    window.location.href = `/admin/bookings/${row.id}?action=reschedule`;
  }

  const policyNote = useMemo(() => {
    if (!closing) return "";
    if (outcome === "cancelled") {
      if (closing.status === "Paid") {
        return "Policy: cancel ≤24h after deposit → FULL REFUND; after 24h → deposit forfeited.";
      }
      return "No deposit recorded here. Apply policy manually in QuickBooks if one was taken.";
    }
    if (outcome === "reschedule") {
      return "Reschedule allowed within 30 days (subject to availability); original deposit honored.";
    }
    if (outcome === "completed") return "Finish = rental fulfilled. Optional “thank you” email.";
    return "";
  }, [closing, outcome]);

  async function finalizeClose() {
    if (!closing) return;

    if (outcome === "reschedule") {
      if (sendRescheduleEmail) {
        await patchStatus(closing.id, {
          reschedule_notify_only: true,
          send_reschedule_email: true,
        });
      }
      startReschedule(closing);
      setClosing(null);
      return;
    }

    const body: Record<string, any> = {
      status: "Closed",
      close_outcome: outcome,
      close_reason: reason || null,
      send_thank_you: outcome === "completed" ? !!sendThankYou : false,
      send_cancel_email: outcome === "cancelled" ? !!sendCancelEmail : false,
    };

    const ok = await patchStatus(closing.id, body);
    if (ok) {
      setRows((p) => p.map((r) => (r.id === closing.id ? { ...r, status: "Closed" } : r)));
      setClosing(null);
    }
  }

  function Actions({ r }: { r: Row }) {
    if (r.status === "Pending") {
      return (
        <div style={actionsWrap}>
          <button style={btn} onClick={() => setApproveFor(r)}>Approve</button>
          <button style={btn} onClick={() => openCloseModal(r, "cancelled")}>Close</button>
        </div>
      );
    }
    if (r.status === "Approved") {
      return (
        <div style={actionsWrap}>
          <button style={btn} onClick={() => markPaid(r)}>Mark Paid</button>
          <button style={btn} onClick={() => startReschedule(r)}>Reschedule</button>
          <button style={btn} onClick={() => openCloseModal(r, "cancelled")}>Close</button>
        </div>
      );
    }
    if (r.status === "Paid") {
      return (
        <div style={actionsWrap}>
          <button style={btn} onClick={() => openCloseModal(r, "completed")}>Finish (Close)</button>
          <button style={btn} onClick={() => startReschedule(r)}>Reschedule</button>
        </div>
      );
    }
    return <span style={{ color: "#b8b8b8" }}>—</span>;
  }

  return (
    <AdminLayout>
      <Head><title>Admin • Bookings</title></Head>
      <h1 style={{ fontSize: 28, margin: "8px 0 16px" }}>Bookings</h1>

      {loading ? (
        <p>Loading…</p>
      ) : rows.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr style={{ textAlign: "left", background: "#141416" }}>
                <th style={th}>Rental</th>
                <th style={th}>Customer</th>
                <th style={th}>Trailer</th>
                <th style={th}>Dates</th>
                <th style={th}>Delivery</th>
                <th style={th}>Status</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #222" }}>
                  <td style={td}>
                    <div style={{ fontWeight: 700 }}>{r.rental_id}</div>
                    <div style={{ fontSize: 12, color: "#b8b8b8" }}>
                      Created {fmtLocal(r.created_at)}
                    </div>
                  </td>
                  <td style={td}>
                    {(r.clients?.first_name || r.clients?.last_name)
                      ? `${r.clients?.first_name ?? ""} ${r.clients?.last_name ?? ""}`.trim()
                      : "—"}
                    <div style={{ fontSize: 12, color: "#b8b8b8" }}>{r.clients?.email ?? "—"}</div>
                  </td>
                  <td style={td}>{r.trailers?.name ?? "—"}</td>
                  <td style={td}>{r.start_date} → {r.end_date}</td>
                  <td style={td}>{r.delivery_requested ? "Requested" : "No"}</td>
                  <td style={td}>
                    <div style={{ display: "grid", gap: 4 }}>
                      <StatusPill status={r.status} />
                      {r.status === "Paid" && r.paid_at && (
                        <div style={{ fontSize: 12, color: "#22c55e" }}>
                          Paid {fmtLocal(r.paid_at)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={td}><Actions r={r} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {closing && (
        <div style={backdrop}>
          <div style={modal}>
            <h3 style={{ margin: "0 0 8px" }}>
              Close booking <span style={{ color: "#93c5fd" }}>{closing.rental_id}</span>
            </h3>

            <div style={{ display: "grid", gap: 10 }}>
              <label style={radioRow}>
                <input type="radio" checked={outcome === "completed"} onChange={() => setOutcome("completed")} />
                <span>Finished (business fulfilled)</span>
              </label>
              <label style={radioRow}>
                <input type="radio" checked={outcome === "cancelled"} onChange={() => setOutcome("cancelled")} />
                <span>Cancelled</span>
              </label>
              {outcome === "cancelled" && (
                <textarea
                  placeholder="Reason (optional, internal)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={ta}
                />
              )}
              <label style={radioRow}>
                <input type="radio" checked={outcome === "reschedule"} onChange={() => setOutcome("reschedule")} />
                <span>Reschedule (no status change now)</span>
              </label>
            </div>

            {policyNote && <div style={{ marginTop: 10, color: "#cbd5e1", fontSize: 13 }}>{policyNote}</div>}

            {outcome === "completed" && (
              <label style={checkRow}>
                <input type="checkbox" checked={sendThankYou} onChange={(e) => setSendThankYou(e.target.checked)} />
                <span>Send “Thank you” email</span>
              </label>
            )}

            {outcome === "cancelled" && (
              <label style={checkRow}>
                <input type="checkbox" checked={sendCancelEmail} onChange={(e) => setSendCancelEmail(e.target.checked)} />
                <span>Send cancellation email (proof of notice)</span>
              </label>
            )}

            {outcome === "reschedule" && (
              <label style={checkRow}>
                <input
                  type="checkbox"
                  checked={sendRescheduleEmail}
                  onChange={(e) => setSendRescheduleEmail(e.target.checked)}
                />
                <span>Send reschedule confirmation email</span>
              </label>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button style={btn} onClick={() => setClosing(null)}>Cancel</button>
              <button style={btn} onClick={finalizeClose}>
                {outcome === "reschedule" ? "Continue" : "Close Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {approveFor && (
        <ApproveModal
          open={true}
          onClose={() => setApproveFor(null)}
          bookingId={approveFor.id}
          defaultLink={approveFor.payment_link || ""}
          onSuccess={refreshRows}
        />
      )}
    </AdminLayout>
  );
}

const th: React.CSSProperties = { padding: "10px 8px", fontSize: 12, color: "#b8b8b8", borderBottom: "1px solid #222" };
const td: React.CSSProperties = { padding: "12px 8px", verticalAlign: "top" };
const btn: React.CSSProperties = { padding: "6px 10px", border: "1px solid #333", borderRadius: 8, background: "#141416", color: "#eaeaea", cursor: "pointer" };
const actionsWrap: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap" };
const backdrop: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "grid", placeItems: "center", zIndex: 1000 };
const modal: React.CSSProperties = { background: "#141416", border: "1px solid #222", borderRadius: 12, padding: 16, width: 560, maxWidth: "92vw" };
const radioRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8 };
const checkRow: React.CSSProperties = { display: "flex", alignItems: "center", gap: 8, marginTop: 12 };
const ta: React.CSSProperties = { padding: 10, borderRadius: 8, background: "#0b1220", color: "#eaeaea", border: "1px solid #1f2937" };
