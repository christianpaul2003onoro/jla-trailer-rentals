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
  /* … keep your other styles … */

  .btnPrimary, .btnOutline {
    border-radius: 14px;
    padding: 14px 22px;
    font-weight: 900;
    letter-spacing: .2px;
    text-decoration: none;
    transition: all .15s ease;
  }

  /* FULL BLUE button */
  .btnPrimary {
    background: #2563eb;                 /* blue fill */
    color: #ffffff !important;           /* white text */
    border: 1px solid #1e40af;           /* darker blue edge */
    box-shadow: 0 8px 24px rgba(37,99,235,.35);
  }
  .btnPrimary:hover { background: #1e40af; }

  /* BLUE OUTLINE button (transparent fill + white text) */
  .btnOutline,
  .btnOutline:link,
  .btnOutline:visited,
  .btnOutline:hover,
  .btnOutline:active {
    color: #ffffff !important;           /* keep text pure white */
  }
  .btnOutline {
    background: transparent;             /* no fill */
    border: 3px solid #2563eb;           /* blue border */
    box-shadow: 0 8px 24px rgba(0,0,0,.35);
  }
  .btnOutline:hover {
    background: rgba(37,99,235,.12);     /* soft blue hover */
  }

  @media (max-width: 480px) {
    .btnPrimary, .btnOutline { width: 100%; text-align: center; }
  }
`}</style>

    </>
  );
}
