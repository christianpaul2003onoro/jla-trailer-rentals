// components/ApproveModal.tsx

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  bookingId: string;
  defaultLink?: string;
  onSuccess?: () => void;
};

export default function ApproveModal({ open, onClose, bookingId, defaultLink, onSuccess }: Props) {
  const [link, setLink] = useState(defaultLink || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // keep input in sync if parent updates defaultLink
  useEffect(() => {
    if (open) setLink(defaultLink || "");
  }, [open, defaultLink]);

  if (!open) return null;

  async function submit() {
    setError(null);

    // quick URL validation
    try {
      const u = new URL(link);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
    } catch {
      setError("Please enter a valid URL (must start with http:// or https://).");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch("/api/admin/bookings/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, paymentLink: link }),
      });

      // read body safely (may not always be JSON)
      const raw = await resp.text();
      let json: any = null;
      try { json = JSON.parse(raw); } catch {}

      if (!resp.ok || (json && json.ok === false)) {
        setError(json?.error || `HTTP ${resp.status}: ${raw || "Unknown error"}`);
        setLoading(false);
        return;
      }

      // success
      onClose();
      onSuccess?.();
    } catch (e: any) {
      setError(e?.message || "Network error while approving booking.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={backdrop}>
      <div style={card}>
        <h3 style={{ margin: "0 0 10px" }}>Approve & Send Payment Link</h3>
        <p style={{ marginTop: 0, color: "#9ca3af", fontSize: 14 }}>
          Paste the QuickBooks payment link below. Once submitted, the customer will automatically receive an email
          with this link to complete their rental payment.
        </p>

        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://pay.quickbooks.intuit.com/..."
          style={input}
          autoFocus
        />

        {error && <div style={{ color: "#f87171", fontSize: 13, marginTop: 6 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btnGhost} disabled={loading}>Cancel</button>
          <button onClick={submit} disabled={loading} style={btnPrimary}>
            {loading ? "Sending..." : "Approve & Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */
const backdrop: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  display: "grid",
  placeItems: "center",
  zIndex: 1000,
};

const card: React.CSSProperties = {
  width: "min(520px, 92vw)",
  background: "#111827",
  color: "#e5e7eb",
  border: "1px solid #1f2937",
  borderRadius: 12,
  padding: 18,
  boxShadow: "0 10px 30px rgba(0,0,0,.45)",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #374151",
  background: "#0b1220",
  color: "#fff",
  outline: "none",
  fontSize: 14,
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
