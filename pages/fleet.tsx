// pages/fleet.tsx
// Shows all active trailers with better contrast and passes ?trailer=<id> to /book

import Head from "next/head";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import type { GetServerSideProps } from "next";
import { getAllTrailerCards, type TrailerCard } from "../lib/trailers";

type Props = { trailers: TrailerCard[] };

export default function FleetPage({ trailers }: Props) {
  return (
    <>
      <Head>
        <title>Our Fleet • JLA Trailer Rentals</title>
        <meta name="description" content="Browse available trailers and book online." />
      </Head>

      <Nav />

      <main style={{ maxWidth: 1100, margin: "32px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, color: "#e5e7eb" }}>
          Our Fleet
        </h1>

        <p style={{ color: "#cbd5e1", marginBottom: 22 }}>
          Browse available trailers. Click <em>View Details</em> for specs or <em>Rent this
          Trailer</em> to start a booking.
        </p>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 18,
          }}
        >
          {trailers.map((t) => (
            <article
              key={t.id}
              style={{
                border: "1px solid #1f2937",
                borderRadius: 10,
                overflow: "hidden",
                background: "#0b1220",
              }}
            >
              <div style={{ background: "#111827" }}>
                <img
                  src={t.photoUrl ?? "/placeholder.jpg"}
                  alt={t.name}
                  style={{ width: "100%", height: 160, objectFit: "cover" }}
                />
              </div>

              <div style={{ padding: 14 }}>
                <h3 style={{ margin: "0 0 6px 0", color: "#f1f5f9", fontWeight: 700 }}>
                  {t.name}
                </h3>

                <div style={{ color: "#93c5fd", marginBottom: 10, fontWeight: 600 }}>
                  ${t.ratePerDay} / day
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <Link
                    href={`/trailer/${t.id}`}
                    style={{
                      border: "1px solid #334155",
                      padding: "8px 10px",
                      borderRadius: 8,
                      color: "#e5e7eb",
                    }}
                  >
                    View Details
                  </Link>

                  {/* IMPORTANT: pass ?trailer=<id> so /book preselects */}
                  <Link
                    href={`/book?trailer=${t.id}`}
                    style={{
                      background: "#2563eb",
                      border: "1px solid #1e40af",
                      padding: "8px 10px",
                      borderRadius: 8,
                      color: "white",
                      fontWeight: 600,
                    }}
                  >
                    Rent this Trailer
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>

      <Footer />
    </>
  );
}

// SSR to read from Supabase via your helper
export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const trailers = await getAllTrailerCards();
  return { props: { trailers } };
};
