// components/Nav.tsx
// Minimal, responsive top bar with brand on the left (clickable Home)
// and simple links on the right. No "@/"; only relative imports.

import Link from "next/link";

export default function Nav() {
  return (
    <header className="hdr">
      <div className="wrap">
        <Link href="/" className="brand" aria-label="Go to Home">
          {/* Put your logo in /public/logo.svg or /public/logo.png */}
          <img src="/logo.svg" alt="" className="logo" />
          <span className="brand-text">JLA Trailer Rentals</span>
        </Link>

        <nav className="menu" aria-label="Primary">
          <Link href="/fleet" className="a">Our Fleet</Link>
          <Link href="/book" className="a">Book</Link>
          <Link href="/find" className="a">Find My Rental</Link>
        </nav>
      </div>

      <style jsx>{`
        .hdr {
          position: sticky;
          top: 0;
          z-index: 40;
          backdrop-filter: saturate(150%) blur(6px);
          background: rgba(7, 10, 18, 0.65);
          border-bottom: 1px solid #0f172a;
        }
        .wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .logo {
          height: 26px;
          width: auto;
        }
        .brand-text {
          color: #e5e7eb;
          font-weight: 800;
          letter-spacing: 0.2px;
        }
        .menu {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .a {
          color: #60a5fa;
          text-decoration: none;
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid transparent;
        }
        .a:hover { border-color: #1e3a8a; background: #0b1220; }

        /* Mobile tweaks */
        @media (max-width: 640px) {
          .wrap { padding: 10px 12px; }
          .brand-text { font-size: 14px; }
          .logo { height: 22px; }
          .menu { gap: 12px; }
          .a { font-size: 14px; padding: 6px 6px; }
        }
      `}</style>
    </header>
  );
}
