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
  trailers?: { name?: string } | null;
  clients?: { first_name?: string | null; last_name?: string | null; email?: string | null } | null;
};

export default function BookingDetails() {
  const router = useRouter();
  const { id, action } = router.query as { id: string; action?: string };
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const resp = await fetch(`/api/admin/bookings?id=${id}`); // if you have a GET list, you can reuse it or add a dedicated one
      // If you don't have a GET by id, you can just show a simple message.
      setLoading(false);
    })();
  }, [id]);

  return (
    <AdminLayout>
      <Head><title>Admin • Booking</title></Head>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <Link href="/admin" style={{ border: "1px solid #333", borderRadius: 8, padding: "6px 10px" }}>← Back</Link>
        <h1 style={{ margin: 0, fontSize: 20 }}>Booking</h1>
      </div>

      <div style={{ marginBottom: 12, color: "#9ca3af" }}>
        {action === "reschedule"
          ? "Reschedule flow coming next. Select new dates and confirm. (This page exists so links don’t 404.)"
          : "Booking details placeholder."}
      </div>

      {loading ? <p>Loading…</p> : <p>Coming soon.</p>}
    </AdminLayout>
  );
}
