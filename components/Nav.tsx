import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Close mobile menu when route changes
  useEffect(() => {
    const handle = () => setOpen(false);
    router.events.on("routeChangeStart", handle);
    return () => router.events.off("routeChangeStart", handle);
  }, [router.events]);

  const linkStyle: React.CSSProperties = {
    color: "#cbd5e1",
    textDecoration: "none",
    fontWeight: 600,
    padding: "10px 12px",
    borderRadius: 8,
    display: "inline-block",
    lineHeight: 1,
  };

  const linkActive: React.CSSProperties = {
    color: "#93c5fd",
  };

  return (
    <header className="nav-root">
      <div className="nav-wrap">
        {/* Left: Logo + Brand (Home) */}
        <Link href="/" className="brand">
          <img
            src="/logo.png"
            alt="JLA Trailer Rentals"
            className="logo"
            width={36}
            height={36}
          />
          <span className="brand-text">JLA Trailer Rentals</span>
        </Link>

        {/* Desktop links */}
        <nav className="links">
          <Link
            href="/fleet"
            style={{
              ...linkStyle,
              ...(router.pathname === "/fleet" ? linkActive : {}),
            }}
          >
            Our Fleet
          </Link>
          <Link
            href="/book"
            style={{
              ...linkStyle,
              ...(router.pathname.startsWith("/book") ? linkActive : {}),
            }}
          >
            Book
          </Link>
          <Link
            href="/find"
            style={{
              ...linkStyle,
              ...(router.pathname === "/find" ? linkActive : {}),
            }}
          >
            Find My Rental
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="hamburger"
          aria-label="Open menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="mobile-menu">
          <Link href="/fleet" className="m-link">
            Our Fleet
          </Link>
          <Link href="/book" className="m-link">
            Book
          </Link>
          <Link href="/find" className="m-link">
            Find My Rental
          </Link>
        </div>
      )}

      <style jsx>{`
        .nav-root {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(2, 6, 23, 0.9); /* slate-950 w/ opacity */
          backdrop-filter: saturate(160%) blur(6px);
          border-bottom: 1px solid #0f172a; /* slate-900 */
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
        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .logo {
          width: 36px;
          height: 36px;
          border-radius: 9999px; /* circular */
          background: #0b1220;
          border: 1px solid #1f2937; /* slate-800 */
          object-fit: cover;
        }
        .brand-text {
          color: #e5e7eb; /* white/soft */
          font-weight: 800;
          font-size: 18px;
          letter-spacing: 0.1px;
          white-space: nowrap;
        }

        .links {
          display: none;
          align-items: center;
          gap: 6px;
        }

        .hamburger {
          display: inline-flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 4px;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 1px solid #1f2937;
          background: #0b1220;
          cursor: pointer;
        }
        .hamburger span {
          width: 18px;
          height: 2px;
          background: #e5e7eb;
          display: block;
          border-radius: 2px;
        }

        .mobile-menu {
          display: grid;
          gap: 8px;
          padding: 10px 16px 14px;
          border-top: 1px solid #0f172a;
          background: rgba(2, 6, 23, 0.95);
        }
        .m-link {
          color: #e5e7eb;
          text-decoration: none;
          font-weight: 600;
          padding: 10px 12px;
          border: 1px solid #1f2937;
          border-radius: 8px;
          background: #0b1220;
        }
        .m-link:hover {
          color: #93c5fd;
          border-color: #1e3a8a; /* blue-800 */
        }

        /* Medium+ screens: show desktop links, keep brand aligned; hide hamburger & mobile menu */
        @media (min-width: 820px) {
          .links {
            display: inline-flex;
          }
          .hamburger {
            display: none;
          }
          .mobile-menu {
            display: none;
          }
        }

        /* Very narrow phones: keep brand visible but let it shrink elegantly */
        @media (max-width: 360px) {
          .brand-text {
            font-size: 16px;
          }
        }

        /* Landscape phone fix: ensure brand sits nicely with logo */
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

        /* Hover states for desktop links */
        :global(a:hover) {
          /* keep other links behavior intact; scoped hover is on inline style above */
        }
        .links :global(a:hover) {
          color: #93c5fd !important; /* blue-300 */
          background: #0b1220;
          border: 1px solid #1e3a8a; /* blue-800 */
        }
      `}</style>
    </header>
  );
}