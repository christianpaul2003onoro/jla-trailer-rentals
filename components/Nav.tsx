// components/Nav.tsx
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Nav() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const done = () => setOpen(false);
    router.events.on("routeChangeComplete", done);
    return () => router.events.off("routeChangeComplete", done);
  }, [router.events]);

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand" aria-label="Home">
          <img src="/logo.png" alt="" className="logo" />
          <span className="brandText">JLA Trailer Rentals</span>
        </Link>

        {/* Desktop/landscape links */}
        <div className="links">
          <Link href="/fleet" className="link">Our Fleet</Link>
          <Link href="/book" className="link">Book</Link>
          <Link href="/find" className="link">Find My Rental</Link>
        </div>

        {/* Portrait-phone hamburger only */}
        <button
          className="hamburger"
          aria-label="Menu"
          onClick={() => setOpen(v => !v)}
        >
          <span /><span /><span />
        </button>
      </nav>

      {open && (
        <div className="drawer">
          <Link href="/fleet" className="drawerLink">Our Fleet</Link>
          <Link href="/book" className="drawerLink">Book</Link>
          <Link href="/find" className="drawerLink">Find My Rental</Link>
        </div>
      )}

      <style jsx>{`
        :global(body){margin:0}

        /* NAV BAR */
        .nav{
          position: sticky; top:0; z-index:50;
          height:64px;                         /* fixed height => easy vertical centering */
          display:flex; align-items:center; justify-content:space-between;
          padding:0 16px;
          background:rgba(7,12,24,.96);
          border-bottom:1px solid #0f1a2e;
          backdrop-filter: saturate(140%) blur(6px);
        }

        /* BRAND (logo + text centered vertically) */
        .brand{
          height:100%;
          display:flex; align-items:center; gap:12px;
          text-decoration:none;
        }
        .logo{
          width:40px; height:40px; object-fit:cover;
          border-radius:9999px;                /* circle */
          border:2px solid rgba(255,255,255,.2);
          background:#0b1220;
        }
        .brandText{
          color:#fff; font-weight:800; font-size:20px; line-height:1;
        }

        /* DESKTOP/LANDSCAPE LINKS */
        .links{ display:flex; gap:22px; }
        .link{
          color:#fff; text-decoration:none; font-weight:600; opacity:.9;
        }
        .link:hover{opacity:1}

        /* HAMBURGER (hidden by default; shown only on portrait phones) */
        .hamburger{
          display:none;
          flex-direction:column; gap:5px;
          background:transparent;
          border:1px solid rgba(255,255,255,.18);
          border-radius:12px; padding:10px;
        }
        .hamburger span{ width:22px; height:2px; background:#fff; border-radius:2px; display:block; }

        /* MOBILE DRAWER */
        .drawer{
          position:sticky; top:64px; z-index:40;
          background:rgba(7,12,24,.98);
          border-bottom:1px solid #0f1a2e;
          display:grid; gap:12px; padding:12px 16px 14px;
        }
        /* force white in the drawer (override any global link color) */
        .drawerLink,
        .drawerLink:visited,
        .drawerLink:active,
        .drawerLink:hover{
          color