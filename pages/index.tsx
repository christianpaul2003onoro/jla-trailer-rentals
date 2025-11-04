// pages/index.tsx
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <div
        style={{
          position: "relative",
          backgroundImage: "url('/home_page_background_wallpaper.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        {/* Overlay for contrast */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            zIndex: 0,
          }}
        ></div>

        {/* Hero content */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
            JLA Trailer Rentals
          </h1>
          <p style={{ fontSize: "1.2rem", marginBottom: "1.5rem" }}>
            Reliable trailers. Simple bookings. Local pickup in Miami.
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              style={{
                backgroundColor: "#0070f3",
                color: "white",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Book a Trailer Rental
            </button>

            <button
              style={{
                backgroundColor: "transparent",
                border: "1px solid white",
                color: "white",
                padding: "0.75rem 1.5rem",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Our Fleet
            </button>

            <button
              style={{
                backgroundColor: "transparent",
                border: "1px solid white",
                color: "white",
                padding: "0.75rem 1.5rem",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Find My Rental
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
