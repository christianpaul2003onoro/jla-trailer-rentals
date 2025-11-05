// pages/index.tsx
import Head from "next/head";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Head>
        <title>JLA Trailer Rentals • Reliable Local Trailer Rentals in Miami</title>
        <meta
          name="description"
          content="Reliable trailers. Simple bookings. Local pickup in Miami."
        />
      </Head>

      {/* Page wrapper: full-viewport background + overlay */}
      <div className="page">
        {/* Top nav (your existing component) */}
        <Nav />

        {/* HERO */}
        <main className="hero">
          <div className="heroInner">
            <h1>JLA Trailer Rentals</h1>

            <p className="tagline">
              Reliable trailers. Simple bookings. Local pickup in Miami.
            </p>

            <div className="btnRow">
              <Link href="/book" className="btnPrimary">
                Book a Trailer Rental
              </Link>

              <Link href="/find" className="btnSecondary">
                Find My Rental
              </Link>
            </div>
          </div>
        </main>

        {/* Footer stays visible without scroll */}
        <Footer />
      </div>

      <style jsx>{`
        /* --- Layout & background --- */
        .page {
          /* Full-screen canvas with your image */
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: space-between; /* nav at top, footer at bottom, hero fills middle */
          background-color: #0b1220;
          background-image: url("/home_page_background_wallpaper.png");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          position: relative;
          overflow: hidden; /* no scroll */
        }
        /* Readability overlay behind everything */
        .page::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(2, 6, 23, 0.25),
            rgba(2, 6, 23, 0.55)
          );
          z-index: 0;
        }

        /* --- Hero --- */
        .hero {
          position: relative;
          z-index: 1; /* above overlay */
          flex: 1; /* fill between nav and footer */
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0 16px;
        }
        .heroInner {
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
        }

        h1 {
          font-size: 42px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 10px 0;
        }

        .tagline {
          color: #cbd5e1;
          font-size: 18px;
          margin: 0 0 24px 0;
          font-weight: 400;
        }

        .btnRow {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* --- Buttons (exact look you liked) --- */
        .btnPrimary {
          background: #2563eb;
          border: 1px solid #1e40af;
          color: #ffffff;
          padding: 12px 18px;
          border-radius: 10px;
          font-weight: 800;
          text-decoration: none;
          font-size: 16px;
        }
        .btnPrimary:hover {
          opacity: 0.96;
        }

        .btnSecondary {
          background: rgba(2, 6, 23, 0.55);
          border: 2px solid #ffffff; /* white border */
          color: #ffffff;            /* white text */
          padding: 12px 18px;
          border-radius: 10px;
          font-weight: 800;
          text-decoration: none;
          font-size: 16px;
        }
        .btnSecondary:hover {
          border-color: #e5e7eb;
          background: rgba(2, 6, 23, 0.65);
        }

        /* --- Mobile tweaks --- */
        @media (max-width: 480px) {
          h1 {
            font-size: 34px;
          }
          .btnPrimary,
          .btnSecondary {
            padding: 11px 16px;
            font-size: 15px;
            font-weight: 800;
          }
        }
      `}</style>
    </>
  );
}
