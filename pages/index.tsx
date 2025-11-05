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

      <Nav />

      {/* HERO SECTION */}
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
          alt="Truck towing trailer at sunset"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        />

        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(2,6,23,0.25), rgba(2,6,23,0.55))", // slightly stronger for readability
            zIndex: 1,
          }}
        />

        {/* Content */}
        <div style={{ zIndex: 2, padding: "0 16px" }}>
          <h1
            style={{
              fontSize: "42px",
              fontWeight: 800,
              color: "white",
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

          {/* --- HERO BUTTONS --- */}
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {/* Primary Button */}
            <Link
              href="/book"
              className="heroPrimaryBtn"
              style={{
                background: "#2563eb",
                border: "1px solid #1e40af",
                color: "#fff",
                padding: "12px 18px",
                borderRadius: 10,
                fontWeight: 800,
                textDecoration: "none",
                fontSize: 16,
              }}
            >
              Book a Trailer Rental
            </Link>

            {/* Secondary Button */}
            <Link
              href="/find"
              className="heroSecondaryBtn"
              style={{
                background: "rgba(2,6,23,0.55)", // subtle dark glass
                border: "2px solid #60a5fa", // visible bright blue border
                color: "#bfdbfe", // light blue text
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

          {/* Hover styles */}
          <style jsx>{`
            .heroPrimaryBtn:hover {
              opacity: 0.96;
            }
            .heroSecondaryBtn:hover {
              border-color: #93c5fd;
              color: #e5effe;
              background: rgba(2, 6, 23, 0.65);
            }
            @media (max-width: 420px) {
              .heroPrimaryBtn,
              .heroSecondaryBtn {
                padding: 11px 16px;
                font-weight: 800;
              }
            }
          `}</style>
        </div>
      </main>

      <Footer />
    </>
  );
}