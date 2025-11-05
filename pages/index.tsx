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
        /* slight, even darkening like your photo */
        .overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,.18),
            rgba(0,0,0,.50)
          );
        }
        .center {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 40px 16px;
        }
        h1 {
          margin: 0 0 10px;
          font-size: clamp(32px, 5vw, 56px);
          font-weight: 900;
          color: #fff;
          text-shadow: 0 2px 6px rgba(0,0,0,.35);
        }
        p {
          margin: 0 0 24px;
          color: #dbeafe;
          font-weight: 500;
        }
        .ctaRow {
          display: inline-flex;
          gap: 14px;
          flex-wrap: wrap;
          justify-content: center;
        }

        /* === Buttons (match your screenshot) === */
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
          color: #fff;
          border: 1px solid #1e40af;
          box-shadow: 0 8px 24px rgba(37,99,235,.35);
        }
        .btnPrimary:hover { background: #1e40af; }

        .btnOutline {
          background: transparent;
          color: #fff;
          border: 3px solid #ffffff;  /* thicker white border so it pops */
          box-shadow: 0 8px 24px rgba(0,0,0,.35);
        }
        .btnOutline:hover { background: rgba(255,255,255,.08); }

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