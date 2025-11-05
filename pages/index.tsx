// pages/index.tsx
import Head from "next/head";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export default function HomePage() {
  return (
    <>
      <Head><title>JLA Trailer Rentals • Miami</title></Head>
      <Nav />

      <header className="hero">
        <img
          src="/home_page_background_wallpaper.png"
          alt="Trailer background"
          className="bg"
        />
        <div className="overlay" />

        <div className="center">
          <h1>JLA Trailer Rentals</h1>
          <p>Reliable trailers. Simple bookings. Local pickup in Miami.</p>
          <div className="ctaRow">
            <Link href="/book" className="btnPrimary">Book a Trailer Rental</Link>
            <Link href="/find" className="btnOutline">Find My Rental</Link>
          </div>
        </div>
      </header>

      <Footer />

      <style jsx>{`
        .hero {
          position: relative;
          min-height: 72vh;
          display: grid;
          place-items: center;
          overflow: hidden;
        }
        .bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
              to bottom,
              rgba(0, 0, 0, 0.2),
              rgba(0, 0, 0, 0.6)
            );
        }
        .center {
          position: relative;
          text-align: center;
          z-index: 1;
          padding: 40px 16px;
        }
        h1 {
          margin: 0 0 8px;
          font-size: clamp(32px, 5vw, 56px);
          font-weight: 900;
          color: #fff;
        }
        p {
          color: #dbeafe;
          margin-bottom: 24px;
          font-weight: 500;
        }
        .ctaRow {
          display: inline-flex;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* Buttons */
        .btnPrimary,
        .btnOutline {
          border-radius: 12px;
          padding: 12px 20px;
          font-weight: 800;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .btnPrimary {
          background: #2563eb;
          color: #fff;
          border: 1px solid #1e40af;
        }
        .btnPrimary:hover {
          background: #1e40af;
        }
        .btnOutline {
          border: 2px solid #fff;
          color: #fff;
          background: transparent;
        }
        .btnOutline:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        @media (max-width: 480px) {
          .btnPrimary,
          .btnOutline {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}