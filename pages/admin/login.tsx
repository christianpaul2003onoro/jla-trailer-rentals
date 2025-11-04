// pages/admin/login.tsx
import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const resp = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await resp.json();
      if (!resp.ok || !json?.ok) {
        setErr(json?.error || "Login failed.");
        setBusy(false);
        return;
      }
      const next = (router.query.next as string) || "/admin";
      window.location.href = next;
    } catch {
      setErr("Network error.");
      setBusy(false);
    }
  }

  const input: React.CSSProperties = {
    padding: 12,
    borderRadius: 8,
    background: "#0b1220",
    color: "#e5e7eb",
    border: "1px solid #1f2937",
    width: "100%",
  };

  return (
    <>
      <Head><title>Admin Login • JLA</title></Head>
      <main style={{ maxWidth: 480, margin: "64px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: "#e5e7eb", marginBottom: 16 }}>
          Admin Login
        </h1>

        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
          />
          {err && (
            <div style={{ color: "#fecaca", border: "1px solid #dc2626", padding: 10, borderRadius: 8 }}>
              {err}
            </div>
          )}
          <button
            type="submit"
            disabled={busy}
            style={{
              background: "#2563eb",
              border: "1px solid #1e40af",
              padding: "10px 14px",
              borderRadius: 8,
              color: "white",
              fontWeight: 700,
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </main>
    </>
  );
}
