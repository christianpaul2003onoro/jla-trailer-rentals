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
      </Head>

      {/* Full-screen background (fixed under everything) */}
      <div className="bg-wrap" aria-hidden>
        <img
          src="/home_page_background_wallpaper.png"
          alt=""
          className="bg-img"
        />
        <div className="bg-overlay" />
      </div>

      <Nav />

      {/* HERO (kept compact so footer fits without scrolling) */}
      <main className="hero">
        <h1>JLA Trailer Rentals</h1>
        <p>Reliable trailers. Simple bookings. Local pickup in Miami.</p>

        <div className="cta">
          <Link href="/book" className="primary">Book a Trailer Rental</Link>
          <Link href="/find" className="secondary">Find My Rental</Link>
        </div>
      </main>

      <Footer />

      <style jsx>{`
        /* Background behind the whole page */
        .bg-wrap {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }
        .bg-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .bg-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(2, 6, 23, 0.25),
            rgba(2, 6, 23, 0.55)
          );
        }

        /* Hero sits above background, below nav/footer */
        .hero {
          position: relative;
          z-index: 1;
          min-height: calc(100vh - 160px); /* leaves room for nav + footer */
          /* tweak if your footer/nav heights differ */
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 24px 16px 120px; /* bottom pad so buttons don't sit under footer */
        }

        .hero h1 {
          font-size: 42px;
          font-weight: 800;
          color: #fff;
          margin: 0 0 10px;
        }
        .hero p {
          color: #cbd5e1;
          font-size: 18px;
          margin: 0 0 24px;
          font-weight: 400;
        }

        .cta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .primary {
          background: #2563eb;
          border: 1px solid #1e40af;
          color: #fff;
          padding: 12px 18px;
          border-radius: 10px;
          font-weight: 800;
          text-decoration: none;
          font-size: 16px;
        }
        .primary:hover { opacity: 0.96; }

        .secondary {
          background: rgba(2, 6, 23, 0.55);
          border: 2px solid #60a5fa;
          color: #bfdbfe;
          padding: 12px 18px;
          border-radius: 10px;
          font-weight: 800;
          text-decoration: none;
          font-size: 16px;
        }
        .secondary:hover {
          border-color: #93c5fd;
          color: #e5effe;
          background: rgba(2, 6, 23, 0.65);
        }

        @media (max-width: 420px) {
          .primary, .secondary { padding: 11px 16px; font-weight: 800; }
          .hero h1 { font-size: 34px; }
        }
      `}</style>
    </>
  );
}
