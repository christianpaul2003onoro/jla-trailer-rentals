// pages/index.tsx
import Head from "next/head";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Head><title>JLA Trailer Rentals • Reliable, Simple, Local</title></Head>
      <Nav />

      {/* HERO */}
      <section className="hero">
        <div className="overlay" />
        <div className="inner">
          <h1 className="title">JLA Trailer Rentals</h1>
          <p className="sub">
            Reliable trailers. Simple bookings. Local pickup in Miami.
          </p>

          {/* Only the two buttons you want, centered, and working */}
          <div className="btns">
            <Link href="/book" className="btn primary">Book a Trailer Rental</Link>
            <Link href="/find" className="btn ghost">Find My Rental</Link>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        .hero {
          position: relative;
          min-height: 72vh;
          background: url("/hero.jpg") center/cover no-repeat; /* your existing hero image path */
          display: grid;
          place-items: center;
        }
        .overlay {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at center, rgba(0,0,0,.35), rgba(0,0,0,.55));
        }
        .inner {
          position: relative;
          max-width: 900px;
          padding: 0 16px;
          text-align: center;
        }
        .title {
          font-size: 48px;
          line-height: 1.05;
          font-weight: 900;
          color: #fff;
          text-shadow: 0 2px 12px rgba(0,0,0,.45);
          margin: 0 0 10px;
        }
        .sub {
          color: #d1d5db;
          font-size: 18px;
          margin: 0 0 22px;
          text-shadow: 0 1px 8px rgba(0,0,0,.35);
        }
        .btns {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn {
          display: inline-block;
          text-decoration: none;
          font-weight: 700;
          border-radius: 10px;
          padding: 12px 16px;
          border: 1px solid #1f2937;
          color: #e5e7eb;
          background: rgba(11, 18, 32, 0.75);
          backdrop-filter: blur(6px);
        }
        .btn:hover { border-color: #1e3a8a; }
        .primary {
          background: #2563eb;
          border-color: #1e40af;
          color: #fff;
        }
        .primary:hover { background: #1d4ed8; }
        .ghost { background: rgba(11,18,32,0.85); }

        @media (max-width: 640px) {
          .title { font-size: 36px; }
          .sub { font-size: 16px; }
          .btn { width: 100%; max-width: 320px; }
        }
      `}</style>
    </>
  );
}
