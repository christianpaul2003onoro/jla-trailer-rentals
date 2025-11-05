// components/Nav.tsx
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Nav() {
  const [open, setOpen] = useState(false);

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
        {/* Brand (Logo + Text together and centered) */}
        <Link href="/" className="brand" aria-label="Home">
          <span className="logoWrap">
            <Image
              src="/logo.png"
              alt="JLA logo"
              width={28}
              height={28}
              priority
            />
          </span>
          <span className="brandText">JLA Trailer Rentals</span>
        </Link>

        {/* Right links (desktop + landscape) */}
        <nav className="links">
          <Link href="/fleet">Our Fleet</Link>
          <Link href="/book">Book</Link>
          <Link href="/find">Find My Rental</Link>
        </nav>

        {/* Hamburger (only mobile portrait) */}
        <button
          className="hamburger"
          onClick={() => setOpen((v) => !v)}
          aria-label="Open menu"
          aria-expanded={open ? "true" : "false"}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>
      </header>

      {/* Drawer menu */}
      {open && (
        <div className="drawer">
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
        .nav {
          position: sticky;
          top: 0;
          z-index: 50;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 12px;
          height: 64px;
          padding: 0 14px;
          background: rgba(7, 12, 24, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(8px);
        }

        /* Brand (logo + title aligned) */
        .brand {
          display: inline-flex;
          align-items: center; /* <-- centers vertically */
          gap: 10px;
          text-decoration: none;
        }

        .logoWrap {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          background: #0b1220;
          border-radius: 999px;
          overflow: hidden;
        }

        .brandText {
          color: #ffffff; /* WHITE text */
          font-weight: 800;
          font-size: 18px;
          text-decoration: none;
          line-height: 1;
        }

        /* Desktop/landscape links */
        .links {
          display: flex;
          align-items: center;
          gap: 18px;
        }
        .links :global(a) {
          color: #ffffff; /* WHITE text */
          text-decoration: none;
          font-weight: 600;
        }
        .links :global(a:hover) {
          color: #93c5fd;
        }

        /* Hamburger */
        .hamburger {
          display: none;
          flex-direction: column;
          justify-content: space-around;
          align-items: center;
          width: 44px;
          height: 44px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          background: transparent;
        }
        .bar {
          width: 20px;
          height: 2px;
          background: #ffffff; /* White bars */
          border-radius: 2px;
        }

        /* Drawer */
        .drawer {
          display: none;
        }

        @media (max-width: 768px) and (orientation: portrait) {
          .links {
            display: none;
          }
          .hamburger {
            display: flex;
          }

          .drawer {
            display: grid;
            gap: 14px;
            padding: 16px;
            background: rgba(7, 12, 24, 0.98);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }
          .drawerLink {
            color: #ffffff !important; /* White */
            font-weight: 700;
            font-size: 17px;
            text-decoration: none;
          }
          .drawerLink:hover {
            color: #3b82f6;
          }
        }
      `}</style>
    </>
  );
}
