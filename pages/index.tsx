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

      <div className="page">
        <Nav />

        {/* --- HERO SECTION --- */}
        <main className="hero">
          <div className="content">
            <h1>JLA Trailer Rentals</h1>
            <p>Reliable trailers. Simple bookings. Local pickup in Miami.</p>

            <div className="buttons">
              <Link href="/book" className="primary">
                Book a Trailer Rental
              </Link>
              <Link href="/find" className="secondary">
                Find My Rental
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>

      <style jsx>{`
        .page {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background-color: #0b1220;
          background-image: url("/home_page_background_wallpaper.png");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        /* Overlay for better text readability */
        .page::before {
          content: "";
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: 0;
        }

        .hero {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 0 16px;
        }

        .content {
          max-width: 900px;
          margin: 0 auto;
        }

        h1 {
          font-size: 42px;
          font-weight: 800;
          color: #ffffff;
          margin-bottom: 10px;
        }

        p {
          color: #cbd5e1;
          font-size: 18px;
          margin-bottom: 24px;
        }

        .buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .primary {
          background: #2563eb;
          border: 1px solid #1e40af;
          color: #ffffff;
          padding: 12px 18px;
          border-radius: 10px;
          font-weight: 800;
          text-decoration: none;
          font-size: 16px;
        }

        .secondary {
          background: rgba(2, 6, 23, 0.55);
          border: 2px solid #ffffff;
          color: #ffffff;
          padding: 12px 18px;
          border-radius: 10px;
          font-weight: 800;
          text-decoration: none;
          font-size: 16px;
        }

        .primary:hover {
          opacity: 0.95;
        }

        .secondary:hover {
          background: rgba(2, 6, 23, 0.65);
          border-color: #e5e7eb;
        }

        @media (max-width: 480px) {
          h1 {
            font-size: 34px;
          }
          .primary,
          .secondary {
            padding: 11px 16px;
            font-size: 15px;
            font-weight: 800;
          }
        }
      `}</style>
    </>
  );
}
