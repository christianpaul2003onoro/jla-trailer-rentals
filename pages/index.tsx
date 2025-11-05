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

      <Nav />

      <main
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          overflow: "hidden",
          backgroundColor: "#0b1220",
        }}
      >
        {/* Background image */}
        <img
          src="/home_page_background_wallpaper.png"
          alt="Pickup truck towing a car on a trailer at sunset"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        />

        {/* Dark overlay for readability */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(2,6,23,0.25), rgba(2,6,23,0.55))",
            zIndex: 1,
          }}
        />

        {/* Hero content */}
        <div style={{ zIndex: 2, padding: "0 16px", width: "100%" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h1
              style={{
                fontSize: "42px",
                fontWeight: 800,
                color: "#ffffff",
                marginBottom: 10,
              }}
            >
              JLA Trailer Rentals
            </h1>

            <p
              style={{
                color: "#cbd5e1",
                fontSize: 18,
                marginBottom: 24,
                fontWeight: 400,
              }}
            >
              Reliable trailers. Simple bookings. Local pickup in Miami.
            </p>

            {/* Buttons */}
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {/* Primary */}
              <Link
                href="/book"
                className="heroPrimaryBtn"
                style={{
                  background: "#2563eb",
                  border: "1px solid #1e40af",
                  color: "#ffffff",
                  padding: "12px 18px",
                  borderRadius: 10,
                  fontWeight: 800,
                  textDecoration: "none",
                  fontSize: 16,
                }}
              >
                Book a Trailer Rental
              </Link>

              {/* Secondary (white border look) */}
              <Link
                href="/find"
                className="heroSecondaryBtn"
                style={{
                  background: "rgba(2,6,23,0.55)",
                  border: "2px solid #ffffff",
                  color: "#ffffff",
                  padding: "12px 18px",
                  borderRadius: 10,
                  fontWeight: 800,
                  textDecoration: "none",
                  fontSize: 16,
                }}
              >
                Find My Rental
              </Link>
            </div>
          </div>

          {/* Small hover + mobile tweaks */}
          <style jsx>{`
            .heroPrimaryBtn:hover {
              opacity: 0.96;
            }
            .heroSecondaryBtn:hover {
              border-color: #e5e7eb;
              background: rgba(2, 6, 23, 0.65);
            }
            @media (max-width: 480px) {
              h1 {
                font-size: 34px !important;
              }
              .heroPrimaryBtn,
              .heroSecondaryBtn {
                padding: 11px 16px !important;
                font-weight: 800 !important;
                font-size: 15px !important;
              }
            }
          `}</style>
        </div>
      </main>

      <Footer />
    </>
  );
}
