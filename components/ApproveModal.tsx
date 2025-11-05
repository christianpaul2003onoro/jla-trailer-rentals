//components/ApproveModal.tsx

import { useState } from "react";

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

  if (!open) return null;

  const submit = async () => {
    setError(null);
    try {
      const u = new URL(link);
      if (!/^https?:/.test(u.protocol)) throw new Error();
    } catch {
      setError("Please enter a valid URL (https://…)"); 
      return;
    }
    setLoading(true);
    const resp = await fetch("/api/admin/bookings/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, paymentLink: link })
    });
    setLoading(false);
    const json = await resp.json();
    if (!resp.ok || !json.ok) {
      setError(json?.error || "Failed to approve");
      return;
    }
    onClose();
    onSuccess?.();
  };

  return (
    <div style={backdrop}>
      <div style={card}>
        <h3 style={{ margin: "0 0 10px" }}>Approve & send payment link</h3>
        <p style={{ marginTop: 0, color: "#9ca3af" }}>
          Paste the QuickBooks payment link. The customer will receive an email immediately.
        </p>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://quickbooks.intuit.com/…"
          style={input}
          autoFocus
        />
        {error && <div style={{ color: "#f87171", fontSize: 13, marginTop: 6 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btnGhost}>Cancel</button>
          <button onClick={submit} disabled={loading} style={btnPrimary}>
            {loading ? "Sending…" : "Approve & Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

const backdrop: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "grid", placeItems: "center", zIndex: 100
};
const card: React.CSSProperties = {
  width: "min(520px, 92vw)", background: "#111827", color: "#e5e7eb",
  border: "1px solid #1f2937", borderRadius: 12, padding: 16, boxShadow: "0 10px 30px rgba(0,0,0,.4)"
};
const input: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #374151",
  background: "#0b1220", color: "#fff", outline: "none"
};
const btnPrimary: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 8, border: "1px solid #1e40af", background: "#2563eb",
  color: "#fff", fontWeight: 700, cursor: "pointer"
};
const btnGhost: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 8, border: "1px solid #374151", background: "transparent",
  color: "#e5e7eb", cursor: "pointer"
};
