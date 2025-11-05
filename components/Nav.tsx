// components/Nav.tsx
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Nav() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    const done = () => setOpen(false);
    router.events.on("routeChangeComplete", done);
    return () => router.events.off("routeChangeComplete", done);
  }, [router.events]);

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          {/* Round logo */}
          <img src="/logo.png" alt="JLA Trailer Rentals" className="logo" />
          <span className="brandText">JLA Trailer Rentals</span>
        </Link>

        {/* Desktop links */}
        <div className="links">
          <Link href="/fleet" className="link">Our Fleet</Link>
          <Link href="/book" className="link">Book</Link>
          <Link href="/find" className="link">Find My Rental</Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="hamburger"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="drawer">
          <Link href="/fleet" className="drawerLink">Our Fleet</Link>
          <Link href="/book" className="drawerLink">Book</Link>
          <Link href="/find" className="drawerLink">Find My Rental</Link>
        </div>
      )}

      <style jsx>{`
        :global(body) {
          margin: 0;
        }
        .nav {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 10px 16px;
          background: rgba(7, 12, 24, 0.96);
          border-bottom: 1px solid #0f1a2e;
          backdrop-filter: saturate(140%) blur(6px);
        }
        .brand {
          display: inline-flex;
          align-items: center;           /* vertical center with logo */
          gap: 10px;
          text-decoration: none;
        }
        .logo {
          width: 36px;
          height: 36px;
          object-fit: cover;
          border-radius: 9999px;         /* circle */
          border: 2px solid rgba(255,255,255,0.2);
          background: #0b1220;
        }
        .brandText {
          color: #ffffff;
          font-weight: 800;
          letter-spacing: 0.2px;
          line-height: 1;                /* tight so it sits centered */
        }
        .links {
          display: none;
          gap: 20px;
        }
        .link {
          color: #ffffff;                /* all white, no blues */
          text-decoration: none;
          font-weight: 600;
          opacity: 0.9;
        }
        .link:hover { opacity: 1; }

        .hamburger {
          display: inline-flex;
          flex-direction: column;
          gap: 5px;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 10px;
          padding: 10px;
        }
        .hamburger span {
          display: block;
          width: 20px;
          height: 2px;
          background: #ffffff;
          border-radius: 2px;
        }

        .drawer {
          position: sticky;
          top: 56px;                     /* height of nav approx */
          z-index: 40;
          background: rgba(7, 12, 24, 0.98);
          border-bottom: 1px solid #0f1a2e;
          padding: 10px 16px 12px;
          display: grid;
          gap: 10px;
        }
        .drawerLink {
          color: #ffffff;                /* white in mobile menu */
          text-decoration: none;
          font-weight: 700;
          font-size: 18px;
        }

        /* Desktop breakpoint */
        @media (min-width: 900px) {
          .links { display: inline-flex; }
          .hamburger { display: none; }
          .drawer { display: none; }
          .brandText { font-size: 18px; }
        }
      `}</style>
    </>
  );
}