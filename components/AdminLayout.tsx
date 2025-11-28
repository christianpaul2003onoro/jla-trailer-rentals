// components/AdminLayout.tsx
import Link from "next/link";
import { useRouter } from "next/router";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = router.pathname;

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    location.href = "/admin/login";
  }

  const linkStyle: React.CSSProperties = {
    color: "#e5e7eb",
    textDecoration: "none",
    fontSize: 14,
    padding: "4px 8px",
    borderRadius: 6,
  };

  const activeLinkStyle: React.CSSProperties = {
    ...linkStyle,
    backgroundColor: "#111827",
    border: "1px solid #374151",
  };

  return (
    <>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #222",
        }}
      >
        <div style={{ fontWeight: 800, color: "#e5e7eb" }}>JLA Admin</div>
        <nav style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link
            href="/admin"
            style={path === "/admin" ? activeLinkStyle : linkStyle}
          >
            Bookings
          </Link>

          <Link
            href="/admin/calendar"
            style={path === "/admin/calendar" ? activeLinkStyle : linkStyle}
          >
            Calendar
          </Link>

          <Link
            href="/admin/trailers"
            style={path === "/admin/trailers" ? activeLinkStyle : linkStyle}
          >
            Trailers
          </Link>

          <button
            onClick={logout}
            style={{
              marginLeft: 12,
              padding: "6px 10px",
              borderRadius: 8,
              background: "#141416",
              border: "1px solid #333",
              color: "#e5e7eb",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </nav>
      </header>
      <main
        style={{
          maxWidth: 1100,
          margin: "16px auto",
          padding: "0 16px",
        }}
      >
        {children}
      </main>
    </>
  );
}
