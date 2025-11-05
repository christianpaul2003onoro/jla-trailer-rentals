import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Nav() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    router.events.on("routeChangeComplete", close);
    return () => router.events.off("routeChangeComplete", close);
  }, [router.events]);

  return (
    <>
      <nav className="nav">
        <div className="inner">
          {/* Brand (left) */}
          <Link href="/" className="brand" aria-label="Home">
            <img src="/logo.png" alt="" className="logo" />
            <span className="brandText">JLA Trailer Rentals</span>
          </Link>

          {/* Desktop / landscape links (right) */}
          <div className="links">
            <Link href="/fleet" className="link">Our Fleet</Link>
            <Link href="/book" className="link">Book</Link>
            <Link href="/find" className="link">Find My Rental</Link>
          </div>

          {/* Hamburger (portrait phones only) */}
          <button
            className="hamburger"
            aria-label="Open Menu"
            onClick={() => setOpen(v => !v)}
          >
            <span/><span/><span/>
          </button>
        </div>
      </nav>

      {open && (
        <div className="drawer">
          <Link href="/fleet" className="drawerLink">Our Fleet</Link>
          <Link href="/book" className="drawerLink">Book</Link>
          <Link href="/find" className="drawerLink">Find My Rental</Link>
        </div>
      )}

      <style jsx>{`
        .nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(7, 12, 24, 0.96);
          border-bottom: 1px solid #0f1a2e;
        }
        .inner {
          height: 68px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 16px;
          display: flex;
          align-items: center;           /* vertical centering with logo */
          justify-content: space-between;
          gap: 16px;
        }

        .brand {
          display: inline-flex;
          align-items: center;           /* name aligns to middle of logo */
          gap: 12px;
          text-decoration: none;
        }
        .logo {
          width: 40px;
          height: 40px;
          border-radius: 999px;          /* perfect circle */
          border: 2px solid rgba(255,255,255,0.18);
          object-fit: cover;
          background: #0b1220;
        }
        .brandText {
          color: #fff;
          font-weight: 800;
          font-size: 19px;
          letter-spacing: .2px;
          line-height: 1;                 /* keeps it centered to the logo */
          white-space: nowrap;
        }

        .links {
          display: flex;
          gap: 26px;
          align-items: center;
        }
        .link {
          color: #fff;
          text-decoration: none;
          font-weight: 700;
          opacity: .95;
        }
        .link:hover { opacity: 1; }

        /* Hamburger hidden by default (desktop / landscape) */
        .hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,.18);
          background: transparent;
        }
        .hamburger span {
          width: 20px;
          height: 2px;
          background: #fff;               /* white bars */
          border-radius: 2px;
        }

        /* Drawer for portrait phones */
        .drawer {
          display: none;
        }

        /* Portrait phones ONLY: show hamburger, hide right links */
        @media (max-width: 768px) and (orientation: portrait) {
          .links { display: none; }
          .hamburger { display: inline-flex; }
          .drawer {
            display: grid;
            gap: 12px;
            padding: 14px 16px;
            background: rgba(7, 12, 24, 0.98);
            border-bottom: 1px solid rgba(255,255,255,0.08);
          }
          .drawer :global(a) { text-decoration: none; }
          .drawerLink {
            color: #fff !important;       /* WHITE links inside drawer */
            font-weight: 800;
            font-size: 17px;
          }
        }
      `}</style>
    </>
  );
}