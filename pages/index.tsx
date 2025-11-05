import Head from "next/head";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>JLA Trailer Rentals • Reliable trailers in Miami</title>
        <meta
          name="description"
          content="Reliable trailers. Simple bookings. Local pickup in Miami."
        />
      </Head>

      <Nav />

      <main>
        <section className="hero">
          <div className="overlay" />
          <div className="center">
            <h1>JLA Trailer Rentals</h1>
            <p className="sub">
              Reliable trailers. Simple bookings. Local pickup in Miami.
            </p>

            <div className="cta">
              <Link href="/book" className="btn primary">
                Book a Trailer Rental
              </Link>
              <Link href="/find" className="btn ghost">
                Find My Rental
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .hero {
          position: relative;
          min-height: 76vh;
          display: grid;
          place-items: center;
          background-image: url("/home_page_background_wallpaper.png");
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        /* SOFTER, balanced overlay — more elegant */
        .overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.2),
            rgba(0, 0, 0, 0.45)
          );
        }

        .center {
          position: relative;
          z-index: 1;
          max-width: 960px;
          margin: 0 auto;
          padding: 48px 16px;
          text-align: center;
        }

        h1 {
          margin: 0 0 12px;
          font-size: 44px;
          font-weight: 900;
          color: #ffffff;
          text-shadow: 0 2px 14px rgba(0, 0, 0, 0.45);
        }

        .sub {
          color: #cbd5e1;
          margin: 0 auto 22px;
          max-width: 760px;
          font-size: 18px;
        }

        .cta {
          display: inline-flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .btn {
          text-decoration: none;
          border-radius: 10px;
          padding: 12px 16px;
          font-weight: 700;
          border: 1px solid #334155;
          color: #e5e7eb;
          transition: 0.2s ease;
        }

        .primary {
          background: #2563eb;
          border-color: #1e40af;
          color: white;
        }

        .primary:hover {
          background: #1d4ed8;
        }

        .ghost {
          background: rgba(2, 6, 23, 0.4);
        }

        .ghost:hover {
          background: rgba(2, 6, 23, 0.55);
        }

        @media (max-width: 640px) {
          h1 {
            font-size: 34px;
          }
          .sub {
            font-size: 16px;
          }
        }
      `}</style>
    </>
  );
}