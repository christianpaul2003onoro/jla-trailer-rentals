// pages/admin/bookings/[id].tsx
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AdminLayout from "../../../components/AdminLayout";

type Row = {
  id: string;
  rental_id: string;
  status: string;
  start_date: string;
  end_date: string;
  trailers?: { name?: string | null } | null;
  clients?: { first_name?: string | null; last_name?: string | null; email?: string | null } | null;
};

export default function BookingDetails() {
  const router = useRouter();
  const { id, action } = router.query as { id?: string; action?: string };
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const resp = await fetch(`/api/admin/bookings/by-id?id=${id}`);
        const json = await resp.json();
        if (!resp.ok || !json?.ok) throw new Error(json?.error || "Failed to load");
        setRow(json.row);
      } catch (e: any) {
        setErr(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <AdminLayout>
      <Head><title>Admin • Booking</title></Head>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <Link href="/admin" style={{ border: "1px solid #333", borderRadius: 8, padding: "6px 10px", textDecoration: "none" }}>
          ← Back
        </Link>
        <h1 style={{ margin: 0, fontSize: 20 }}>Booking</h1>
      </div>

      {action === "reschedule" ? (
        <p style={{ color: "#9ca3af", marginTop: 0 }}>
          Reschedule flow: select new dates and confirm (UI coming next).
        </p>
      ) : (
        <p style={{ color: "#9ca3af", marginTop: 0 }}>Booking details.</p>
      )}

      {loading && <p>Loading…</p>}
      {err && <p style={{ color: "#f87171" }}>{err}</p>}

      {row && !loading && !err && (
        <div style={{ border: "1px solid #222", borderRadius: 12, padding: 16, background: "#141416" }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div><strong>Rental ID:</strong> {row.rental_id}</div>
            <div><strong>Status:</strong> {row.status}</div>
            <div><strong>Trailer:</strong> {row.trailers?.name ?? "—"}</div>
            <div><strong>Dates:</strong> {row.start_date} → {row.end_date}</div>
            <div>
              <strong>Customer:</strong>{" "}
              {(row.clients?.first_name || row.clients?.last_name)
                ? `${row.clients?.first_name ?? ""} ${row.clients?.last_name ?? ""}`.trim()
                : "—"}
              {" "}
              <span style={{ color: "#9ca3af" }}>({row.clients?.email ?? "—"})</span>
            </div>
          </div>

          {action === "reschedule" && (
            <div style={{ marginTop: 14, color: "#9ca3af" }}>
              {/* placeholder for the upcoming date picker/form */}
              New date selector will go here.
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
