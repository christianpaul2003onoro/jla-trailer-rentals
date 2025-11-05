import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";

export default function Nav() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // NOTE: Your repo currently has /public/logo.png.png.
  // If you later rename it to /public/logo.png, just change the src below.
  const logoSrc = "/logo.png.png";

  const linkStyle: React.CSSProperties = {
    color: "#93c5fd",
    textDecoration: "none",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid transparent",
    fontWeight: 600,
  };

  const activeStyle: React.CSSProperties = {
    ...linkStyle,
    borderColor: "#1e40af",
    background: "rgba(30, 64, 175, 0.15)",
  };

  return (
    <header className="nav">
      <div className="inner">
        <Link href="/" className="brand" aria-label="Go to homepage">
          <span className="logoWrap">
            <Image
              src={logoSrc}
              alt="JLA Trailer Rentals logo"
              width={34}
              height={34}
              priority
              className="logo"
            />
          </span>
          <span className="brandText">JLA Trailer Rentals</span>
        </Link>

        <nav className={`links ${open ? "open" : ""}`}>
          <Link
            href="/fleet"
            style={router.pathname === "/fleet" ? activeStyle : linkStyle}
          >
            Our Fleet
          </Link>
          <Link
            href="/book"
            style={router.pathname === "/book" ? activeStyle : linkStyle}
          >
            Book
          </Link>
          <Link
            href="/find"
            style={router.pathname === "/find" ? activeStyle : linkStyle}
          >
            Find My Rental
          </Link>
        </nav>

        <button
          className="menuBtn"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          ☰
        </button>
      </div>

      <style jsx>{`
        .nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(3, 7, 18, 0.9);
          backdrop-filter: blur(6px);
          border-bottom: 1px solid #111827;
        }
        .inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #e5e7eb;
          text-decoration: none;
          font-weight: 800;
        }
        .logoWrap {
          display: inline-flex;
          border-radius: 999px;
          overflow: hidden;
          width: 34px;
          height: 34px;
          border: 1px solid #1f2937;
          background: #0b1220;
        }
        .logo {
          object-fit: cover;
        }
        .brandText {
          line-height: 1;
          display: none;
        }
        .links {
          display: none;
          gap: 8px;
          align-items: center;
        }
        .menuBtn {
          background: transparent;
          color: #e5e7eb;
          border: 1px solid #1f2937;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 18px;
          display: inline-flex;
        }
        @media (min-width: 700px) {
          .brandText {
            display: inline-block;
          }
          .links {
            display: inline-flex;
          }
          .menuBtn {
            display: none;
          }
        }
        /* Mobile dropdown */
        .links.open {
          position: absolute;
          top: 56px;
          right: 10px;
          background: #0b1220;
          border: 1px solid #1f2937;
          border-radius: 10px;
          padding: 8px;
          display: grid;
          gap: 6px;
        }
        @media (min-width: 700px) {
          .links.open {
            position: static;
            display: inline-flex;
            background: transparent;
            border: none;
            padding: 0;
          }
        }
      `}</style>
    </header>
  );
}
