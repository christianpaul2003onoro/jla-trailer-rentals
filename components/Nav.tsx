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
    <> {/* ⬅️ OPEN fragment */}
      <header className="nav">
        <Link href="/" className="brandLeft" aria-label="Home">
          <span className="logoWrap">
            <Image src="/logo.png" alt="JLA logo" width={28} height={28} priority />
          </span>
        </Link>

        <Link href="/" className="brandCenter">JLA Trailer Rentals</Link>

        <nav className="links">
          <Link href="/fleet" className="navLink">Our Fleet</Link>
          <Link href="/book" className="navLink">Book</Link>
          <Link href="/find" className="navLink">Find My Rental</Link>
        </nav>

        <button
          className="hamburger"
          onClick={() => setOpen(v => !v)}
          aria-label="Open menu"
          aria-expanded={open ? "true" : "false"}
        >
          <span className="bar" /><span className="bar" /><span className="bar" />
        </button>
      </header>

      {open && (
        <div className="drawer">
          <Link href="/fleet" className="drawerLink" onClick={() => setOpen(false)}>Our Fleet</Link>
          <Link href="/book"  className="drawerLink" onClick={() => setOpen(false)}>Book</Link>
          <Link href="/find"  className="drawerLink" onClick={() => setOpen(false)}>Find My Rental</Link>
        </div>
      )}

      <style jsx>{`
        .nav {
          position: sticky; top: 0; z-index: 50;
          display: grid; grid-template-columns: 48px 1fr auto; align-items: center; gap: 12px;
          height: 64px; padding: 0 14px;
          background: rgba(7,12,24,0.90);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(8px);
        }
        .logoWrap { width: 36px; height: 36px; display:grid; place-items:center; background:#0b1220; border-radius:999px; overflow:hidden; }

        /* 🔒 Force WHITE for all anchor states inside the navbar */
        .nav :where(a, a:link, a:visited, a:hover, a:active) {
          color: #ffffff !important;
          text-decoration: none;
        }

        .brandCenter { justify-self:center; font-weight:800; font-size:18px; letter-spacing:.2px; }

        .links { display:flex; align-items:center; gap:18px; }
        .navLink { font-weight:700; }
        .navLink:hover { color:#e6f0ff !important; }

        .hamburger { display:none; width:44px; height:44px; border:1px solid rgba(255,255,255,.15); border-radius:10px; background:transparent; }
        .bar { width:20px; height:2px; background:#fff; border-radius:2px; }

        .drawer { display:none; }

        @media (max-width:768px) and (orientation:portrait) {
          .links { display:none; }
          .hamburger { display:flex; flex-direction:column; justify-content:center; gap:4px; }
          .drawer {
            display:grid; gap:14px; padding:16px;
            background:rgba(7,12,24,.98);
            border-bottom:1px solid rgba(255,255,255,.08);
          }
          /* 🔒 Drawer links white in all states */
          .drawer :where(a, a:link, a:visited, a:hover, a:active) {
            color:#ffffff !important; font-weight:700; font-size:17px; text-decoration:none;
          }
          .drawer a:hover { color:#e6f0ff !important; }
        }
      `}</style>
    </>  /* ⬅️ CLOSE fragment — prevents the compile error */
  );
}
