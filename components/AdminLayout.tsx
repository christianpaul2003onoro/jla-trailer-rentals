// components/AdminLayout.tsx
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    location.href = "/admin/login";
  }
  return (
    <>
      <header style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid #222" }}>
        <div style={{ fontWeight: 800, color: "#e5e7eb" }}>JLA Admin</div>
        <nav style={{ display: "flex", gap: 16 }}>
          <Link href="/admin">Bookings</Link>
          <Link href="/admin/trailers">Trailers</Link>
          <button onClick={logout} style={{ marginLeft: 12, padding: "6px 10px", borderRadius: 8, background: "#141416", border: "1px solid #333", color: "#e5e7eb", cursor: "pointer" }}>
            Logout
          </button>
        </nav>
      </header>
      <main style={{ maxWidth: 1100, margin: "16px auto", padding: "0 16px" }}>{children}</main>
    </>
  );
}
