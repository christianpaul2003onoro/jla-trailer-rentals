// components/Nav.tsx
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const close = () => setOpen(false);
    router.events.on("routeChangeStart", close);
    return () => router.events.off("routeChangeStart", close);
  }, [router.events]);

  const linkBase: React.CSSProperties = {
    color: "#ffffff", // white
    textDecoration: "none",
    fontWeight: 700,
    padding: "10px 12px",
    borderRadius: 8,
    display: "inline-flex",
    alignItems: "center",
    lineHeight: 1,
  };

  const linkActive: React.CSSProperties = { color: "#93c5fd" };

  return (
    <header className="nav-root">
      <div className="nav-wrap">
        {/* ✅ Brand (Logo + Title centered vertically) */}
        <Link href="/" className="brand" aria-label="Home">
          <div className="brand-group">
            <img src="/logo.png" alt="JLA Trailer Rentals logo" className="logo" />
            <span className="brand-text">JLA Trailer Rentals</span>
          </div>
        </Link>

        {/* Desktop links */}
        <nav className="links">
          <Link href="/fleet" style={{ ...linkBase, ...(router.pathname === "/fleet" ? linkActive : {}) }}>
            Our Fleet
          </Link>
          <Link href="/book" style={{ ...linkBase, ...(router.pathname.startsWith("/book") ? linkActive : {}) }}>
            Book
          </Link>
          <Link href="/find" style={{ ...linkBase, ...(router.pathname === "/find" ? linkActive : {}) }}>
            Find My Rental
          </Link>
        </nav>

        {/* Hamburger */}
        <button className="hamburger" aria-label="Menu" onClick={() => setOpen((v) => !v)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="mobile-menu">
          <Link href="/fleet" className="m-link" onClick={() => setOpen(false)}>
            Our Fleet
          </Link>
          <Link href="/book" className="m-link" onClick={() => setOpen(false)}>
            Book
          </Link>
          <Link href="/find" className="m-link" onClick={() => setOpen(false)}>
            Find My Rental
          </Link>
        </div>
      )}

      <style jsx>{`
        .nav-root {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(2, 6, 23, 0.9);
          backdrop-filter: saturate(160%) blur(6px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .nav-wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        /* ✅ Brand alignment fix */
        .brand {
          text-decoration: none;
        }
        .brand-group {
          display: inline-flex;
          align-items: center; /* centers logo + text perfectly */
          gap: 10px;
        }

        .logo {
          width: 36px;
          height: 36px;
          border-radius: 9999px;
          object-fit: cover;
          background: #0b1220;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .brand-text {
          color: #ffffff; /* White */
          font-weight: 800;
          font-size: 18px;
          letter-spacing: 0.1px;
          line-height: 1;
          white-space: nowrap;
        }

        .links {
          display: none;
          align-items: center;
          gap: 10px;
        }

        .hamburger {
          display: inline-flex;
          flex-direction: column;
          gap: 4px;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: transparent;
          cursor: pointer;
          align-items: center;
          justify-content: center;
        }

        .hamburger span {
          width: 18px;
          height: 2px;
          background: #ffffff;
          border-radius: 2px;
        }

        .mobile-menu {
          display: grid;
          gap: 4px;
          padding: 10px 16px 14px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(2, 6, 23, 0.98);
        }

        .m-link {
          display: block;
          text-decoration: none !important;
          color: #ffffff !important;
          font-weight: 700;
          padding: 12px 6px;
        }

        .m-link:hover {
          color: #93c5fd !important;
        }

        @media (min-width: 820px) {
          .links {
            display: inline-flex;
          }
          .hamburger,
          .mobile-menu {
            display: none;
          }
        }

        @media (max-height: 420px) and (orientation: landscape) {
          .brand-text {
            font-size: 16px;
          }
          .logo {
            width: 32px;
            height: 32px;
          }
          .nav-wrap {
            padding-top: 6px;
            padding-bottom: 6px;
          }
        }
      `}</style>
    </header>
  );
}
