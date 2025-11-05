// components/Nav.tsx
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Nav() {
  const [open, setOpen] = useState(false);

  // Close drawer on route changes / Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="nav">
      <div className="inner">
        {/* Left: Logo + Brand (perfectly centered vertically) */}
        <Link href="/" className="brand">
          <span className="logoWrap">
            <Image
              src="/logo.png"
              alt="JLA Trailer Rentals"
              width={36}
              height={36}
              className="logo"
              priority
            />
          </span>
          <span className="brandText">JLA Trailer Rentals</span>
        </Link>

        {/* Desktop menu */}
        <nav className="links">
          <Link href="/fleet" className="link">Our Fleet</Link>
          <Link href="/book" className="link">Book</Link>
          <Link href="/find" className="link">Find My Rental</Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="burger"
          aria-label="Open menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
      </div>

      {/* Mobile drawer */}
      <div className={`drawer ${open ? "open" : ""}`}>
        <Link href="/fleet" className="drawerLink" onClick={() => setOpen(false)}>
          Our Fleet
        </Link>
        <Link href="/book" className="drawerLink" onClick={() => setOpen(false)}>
          Book
        </Link>
        <Link href="/find" className="drawerLink" onClick={() => setOpen(false)}>
          Find My Rental
        </Link>
      </div>

      <style jsx>{`
        .nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #0a0f1a; /* same dark as site */
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 10px 16px;            /* a bit taller */
          display: flex;
          align-items: center;           /* centers brand with logo vertically */
          justify-content: space-between;
          gap: 12px;
        }

        .brand {
          display: inline-flex;
          align-items: center;           /* <- perfect vertical center with logo */
          gap: 10px;
          text-decoration: none;
        }
        .logoWrap {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: #0f172a;
          outline: 1px solid rgba(255,255,255,0.15);
        }
        .logo {
          object-fit: cover;
          border-radius: 999px;
        }
        .brandText {
          color: #ffffff;
          font-weight: 800;
          letter-spacing: 0.2px;
          line-height: 1;                /* keeps it centered relative to logo */
          font-size: 18px;
        }

        .links {
          display: none;
          gap: 22px;
          align-items: center;
        }
        .link {
          color: #ffffff;                 /* ALWAYS white */
          text-decoration: none;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 6px;
          transition: color .15s ease, background .15s ease;
        }
        .link:hover {
          background: rgba(255,255,255,0.08);
        }

        .burger {
          display: inline-grid;
          gap: 4px;
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.14);
          place-items: center;
        }
        .burger .bar {
          width: 18px;
          height: 2px;
          background: #ffffff;
          border-radius: 2px;
        }

        .drawer {
          display: none;
        }
        .drawer.open {
          display: block;
          background: #0a0f1a;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .drawerLink {
          display: block;
          color: #ffffff;                /* WHITE, not blue */
          text-decoration: none;
          font-weight: 600;
          padding: 14px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .drawerLink:hover {
          background: rgba(255,255,255,0.06);
        }

        /* Desktop breakpoint */
        @media (min-width: 900px) {
          .brandText { font-size: 19px; }
          .links { display: flex; }
          .burger { display: none; }
          .drawer { display: none !important; }
        }
      `}</style>
    </header>
  );
}