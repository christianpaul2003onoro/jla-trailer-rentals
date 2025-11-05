// pages/index.tsx (HomePage)
import Head from "next/head";
import Link from "next/link";
import { useEffect } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export default function HomePage() {
  useEffect(() => {
    document.body.classList.add("home-has-wallpaper");
    return () => document.body.classList.remove("home-has-wallpaper");
  }, []);

  return (
    <>
      <Head><title>JLA Trailer Rentals • Miami</title></Head>
      <Nav />

      <header className="hero">
        {/* ⬅️ removed the <img className="bg" /> and the overlay */}
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
          min-height: 80vh;              /* tall hero; background is on <body> */
          display: grid;
          place-items: center;
          padding: 40px 16px;
        }
        .center { text-align: center; }
        h1 {
          margin: 0 0 10px;
          font-size: clamp(32px, 5vw, 56px);
          font-weight: 900;
          color: #fff;
          text-shadow: 0 2px 6px rgba(0,0,0,.35);
        }
        p { margin: 0 0 24px; color: #dbeafe; font-weight: 500; }
        .ctaRow { display: inline-flex; gap: 14px; flex-wrap: wrap; justify-content: center; }

        /* Buttons (exact look of your screenshot) */
        .btnPrimary,
        .btnOutline {
          border-radius: 14px;
          padding: 14px 22px;
          font-weight: 900;
          letter-spacing: .2px;
          text-decoration: none;
          transition: all .15s ease;
        }
        .btnPrimary {
          background: #2563eb;
          color: #ffffff !important;
          border: 1px solid #1e40af;
          box-shadow: 0 8px 24px rgba(37,99,235,.35);
        }
        .btnPrimary:hover { background: #1e40af; }

        /* 🔒 PURE WHITE text on the outline button (no bluish visited state) */
        .btnOutline,
        .btnOutline:link,
        .btnOutline:visited,
        .btnOutline:hover,
        .btnOutline:active {
          color: #ffffff !important;
        }
        .btnOutline {
          background: transparent;
          border: 3px solid #ffffff;
          box-shadow: 0 8px 24px rgba(0,0,0,.35);
        }
        .btnOutline:hover { background: rgba(255,255,255,.08); }

        @media (max-width: 480px) {
          .btnPrimary, .btnOutline { width: 100%; text-align: center; }
        }
      `}</style>

      {/* Global wallpaper so it shows behind nav + footer (no second <img>) */}
      <style jsx global>{`
        body.home-has-wallpaper {
          background:
            linear-gradient(rgba(0,0,0,.18), rgba(0,0,0,.50)),
            url('/home_page_background_wallpaper.png') center / cover fixed no-repeat;
        }
      `}</style>
    </>
  );
}
