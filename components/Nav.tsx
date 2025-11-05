// components/Nav.tsx
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Nav() {
  const [open, setOpen] = useState(false);

  // Close drawer on route change or resize/orientation change
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("resize", close);
    window.addEventListener("orientationchange", close);
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("orientationchange", close);
    };
  }, []);

  return (
    <>
      <header className="nav">
        {/* Left: Logo */}
        <Link href="/" className="brandLeft" aria-label="Go to Home">
          <span className="logoWrap" aria-hidden>
            <Image
              src="/logo.png"
              alt="JLA logo"
              width={28}
              height={28}
              priority
            />
          </span>
        </Link>

        {/* Center: Brand text (always centered) */}
        <Link href="/" className="brandCenter">
          JLA Trailer Rentals
        </Link>

        {/* Right: inline links (desktop & mobile landscape) */}
        <nav className="links" aria-label="Primary">
          <Link href="/fleet">Our Fleet</Link>
          <Link href="/book">Book</Link>
          <Link href="/find">Find My Rental</Link>
        </nav>

        {/* Right: hamburger (only mobile portrait) */}
        <button
          className="hamburger"
          onClick={() => setOpen((v) => !v)}
          aria-label="Open menu"
          aria-expanded={open ? "true" : "false"}
          aria-controls="mobile-drawer"
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
      </header>

      {/* Drawer (mobile portrait only) */}
      {open && (
        <div id="mobile-drawer" className="drawer" role="dialog" aria-modal="true">
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
      )}

      <style jsx>{`
        /* Bar container */
        .nav {
          position: sticky;
          top: 0;
          z-index: 50;
          display: grid;
          grid-template-columns: 48px 1fr auto; /* logo | center brand | right area */
          align-items: center;
          gap: 12px;
          height: 64px;
          padding: 0 14px;
          background: rgba(7, 12, 24, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(8px);
        }

        /* Left logo */
        .logoWrap {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          background: #0b1220;
          border: 2px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px; /* circle */
          overflow: hidden; /* keep the logo inside circle */
        }
        .brandLeft {
          display: grid;
          place-items: center;
          height: 100%;
        }

        /* Center title */
        .brandCenter {
          justify-self: center;   /* real center in the grid */
          color: #eaf2ff;
          font-weight: 800;
          letter-spacing: 0.2px;
          text-decoration: none;
          font-size: 18px;
          line-height: 1;
          white-space: nowrap;
        }

        /* Right links (inline) */
        .links {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .links :global(a) {
          color: #e5e7eb;
          text-decoration: none;
          font-weight: 600;
        }
        .links :global(a:hover) {
          color: #93c5fd;
        }

        /* Hamburger button — hidden by default (shows only on mobile portrait) */
        .hamburger {
          display: none;
          width: 44px;
          height: 44px;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(15, 18, 26, 0.6);
        }
        .bar {
          width: 20px;
          height: 2px;
          background: #ffffff; /* white bars */
          display: block;
          margin: 2px 0;
          border-radius: 2px;
        }

        /* Drawer (opens below bar) */
        .drawer {
          display: none; /* enabled in mobile portrait rules */
        }

        /* -------------------------------
           Mobile portrait rules
           - hide inline links
           - show hamburger
           - enable white drawer text
        --------------------------------*/
        @media (max-width: 768px) and (orientation: portrait) {
          .links {
            display: none;
          }
          .hamburger {
            display: inline-flex;
          }

          .drawer {
            display: grid;
            gap: 14px;
            padding: 16px;
            background: rgba(7, 12, 24, 0.98);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            animation: slideDown 180ms ease-out;
          }
          .drawerLink {
            color: #ffffff !important; /* force white */
            font-weight: 700;
            font-size: 17px;
            text-decoration: none;
          }
          .drawerLink:hover {
            color: #93c5fd;
          }

          /* slightly larger center brand on phones */
          .brandCenter {
            font-size: 17px;
          }
        }

        /* Mobile landscape & desktop:
           - show links, hide hamburger (default already does it) */

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}