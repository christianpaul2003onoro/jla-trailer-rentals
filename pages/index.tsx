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
        {/* Background image */}
        <img
          src="/home_page_background_wallpaper.png"
          alt=""
          className="bg"
        />
        {/* Soft dark overlay */}
        <div className="overlay" />

        {/* Center content */}
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
          border-bottom: 1px solid #0f1a2e;
        }
        .bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(1.02);
          filter: saturate(105%);
        }
        .overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(
              1200px 600px at 50% 60%,
              rgba(0,0,0,0.10),
              rgba(0,0,0,0.45)
            ),
            linear-gradient(
              to bottom,
              rgba(7,12,24,0.15),
              rgba(7,12,24,0.55)
            );
        }
        .center {
          position: relative;
          text-align: center;
          padding: 40px 16px 60px;
          max-width: 980px;
          z-index: 1;
        }
        h1 {
          margin: 0 0 8px;
          font-size: clamp(32px, 5.3vw, 56px);
          font-weight: 900;
          color: #ffffff;
          text-shadow: 0 10px 35px rgba(0,0,0,0.55);
        }
        p {
          margin: 0 0 22px;
          color: #dbeafe;
          font-weight: 500;
          text-shadow: 0 8px 30px rgba(0,0,0,0.55);
        }

        .ctaRow {
          display: inline-flex;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .btnPrimary, .btnOutline {
          display: inline-block;
          border-radius: 12px;
          padding: 12px 18px;
          font-weight: 800;
          text-decoration: none;
          transition: transform .05s ease, box-shadow .15s ease, background .15s ease;
        }
        .btnPrimary {
          background: #2563eb;
          color: #ffffff;
          border: 1px solid #1e40af;
          box-shadow: 0 8px 26px rgba(37,99,235,0.35);
        }
        .btnPrimary:hover { transform: translateY(-1px); }

        .btnOutline {
          color: #e5e7eb;
          background: rgba(3,7,18,0.25);
          border: 2px solid rgba(255,255,255,0.85); /* stronger, visible outline */
          backdrop-filter: blur(2px);
        }
        .btnOutline:hover { transform: translateY(-1px); }

        @media (max-width: 480px) {
          .btnPrimary, .btnOutline {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}