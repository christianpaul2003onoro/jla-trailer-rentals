// pages/trailer/[id].tsx
// Trailer details fetched server-side from Supabase.
// "Book this trailer" sends ?trailer=<id> to /book so the dropdown is preselected.

import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

type TrailerDetail = {
  id: string;
  name: string;
  rate_per_day: number;
  weight_rating: number | null;
};

type Props = { trailer: TrailerDetail | null };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const id = (ctx.params?.id as string) || "";
  const { data, error } = await supabaseAdmin
    .from("trailers")
    .select("id,name,rate_per_day,weight_rating")
    .eq("id", id)
    .eq("active", true)
    .single();

  return { props: { trailer: error ? null : (data as TrailerDetail) } };
};

export default function TrailerDetailPage({ trailer }: Props) {
  if (!trailer) {
    return (
      <>
        <Nav />
        <div className="container">
          <p>Trailer not found.</p>
          <p><Link href="/fleet">← Back to Fleet</Link></p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Head><title>{trailer.name} — JLA Trailer Rentals</title></Head>
      <Nav />

      <div className="container">
        <p style={{ marginBottom: 12 }}>
          <Link href="/fleet">← Back to Fleet</Link>
        </p>

        <h1 style={{ margin: "0 0 16px 0" }}>{trailer.name}</h1>

        <div className="card" style={{ display: "grid", gridTemplateColumns: "minmax(280px, 520px) 1fr", gap: 20 }}>
          <div>
            <img
              src={"/home_page_background_wallpaper.png"}
              alt={trailer.name}
              style={{ width: "100%", height: 320, objectFit: "cover", borderRadius: 8 }}
            />
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>
              ${trailer.rate_per_day} / day
            </div>

            <ul style={{ marginTop: 0, marginBottom: 16, lineHeight: 1.7 }}>
              <li>Weight rating: {trailer.weight_rating ?? "—"} lbs</li>
              <li>Daily rate applies to each 24-hour period.</li>
            </ul>

            {/* ✅ This now preselects the trailer on /book */}
            <Link href={`/book?trailer=${trailer.id}`} className="btn primary">
              Book this trailer
            </Link>

            <p style={{ marginTop: 16, color: "var(--muted)" }}>
              Delivery available on request — $2.50/mile traveled (quoted later on invoice).
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
