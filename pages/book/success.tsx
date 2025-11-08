// pages/book/success.tsx
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";

type Creds = { rental?: string; key?: string; name?: string; email?: string };

export default function BookingSuccess() {
  const router = useRouter();
  const [creds, setCreds] = useState<Creds>({});
  const confirmFired = useRef(false); // avoid double POSTs during route hydration
  const [confirmState, setConfirmState] = useState<"idle" | "sending" | "sent" | "skipped" | "error">("idle");

  // 1) Collect credentials from query or storage (your original logic, kept intact)
  useEffect(() => {
    const qp: Creds = {
      rental: (router.query.rental as string) || (router.query.rid as string) || "",
      key: (router.query.key as string) || "",
      name: (router.query.name as string) || "",
      email: (router.query.email as string) || "",
    };

    if (qp.rental && qp.key) {
      setCreds(qp);
      return;
    }

    try {
      const raw =
        (typeof window !== "undefined" && sessionStorage.getItem("jla_last_rental")) ||
        (typeof window !== "undefined" && localStorage.getItem("jla_last_rental"));
      if (raw) {
        const stored = JSON.parse(raw) as Creds;
        setCreds({
          rental: stored.rental || qp.rental || "",
          key: stored.key || qp.key || "",
          name: stored.name || qp.name || "",
          email: stored.email || qp.email || "",
        });
      } else {
        setCreds(qp);
      }
    } catch {
      setCreds(qp);
    }
  }, [router.query]);

  // 2) Fire-and-forget confirmation email AFTER success page is shown
  useEffect(() => {
    const rid = creds.rental?.trim();
    if (!rid || confirmFired.current) return;

    confirmFired.current = true;
    setConfirmState("sending");

    fetch("/api/bookings/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rental_id: rid }),
    })
      .then(async (r) => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok || j?.ok === false) {
          setConfirmState("error");
          console.warn("[success] confirm email failed:", j?.error || r.statusText);
          return;
        }
        setConfirmState(j.sent ? "sent" : "skipped"); // skipped = already sent before (idempotent)
      })
      .catch((e) => {
        setConfirmState("error");
        console.warn("[success] confirm email network error:", e?.message || e);
      });
  }, [creds.rental]);

  const rental = creds.rental || "";
  const key = creds.key || "";
  const name = creds.name || "";
  const email = creds.email || "";
  const findUrl = `/find?rental=${encodeURIComponent(rental)}&key=${encodeURIComponent(key)}`;

  return (
    <>
      <Head><title>Booking Submitted • JLA</title></Head>
      <Nav />
      <main className="container" style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Thanks{ name ? `, ${name}` : "" }!</h1>

        <p style={{ color: "#cbd5e1", marginBottom: 16 }}>
          We’ve received your booking! A confirmation email was sent to <strong>{email || "your email"}</strong>{" "}
          with your <strong>Rental ID</strong> and <strong>Access Key</strong>. You’ll hear from us once your request is approved.
        </p>

        {/* (Optional) tiny status note, not required; keep if you want debugging help */}
        {confirmState === "sending" && (
          <div style={{ color: "#93c5fd", fontSize: 13, marginBottom: 8 }}>Sending confirmation…</div>
        )}
        {confirmState === "sent" && (
          <div style={{ color: "#86efac", fontSize: 13, marginBottom: 8 }}>Confirmation sent.</div>
        )}
        {confirmState === "skipped" && (
          <div style={{ color: "#a3a3a3", fontSize: 13, marginBottom: 8 }}>Confirmation already sent.</div>
        )}
        {confirmState === "error" && (
          <div style={{ color: "#f87171", fontSize: 13, marginBottom: 8 }}>
            We couldn’t send the confirmation email automatically.
          </div>
        )}

        <div style={{ background: "#0b1220", border: "1px solid #1f2937", borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, color: "#e5e7eb", marginBottom: 8 }}>Your booking credentials</div>
          <div style={{ color: "#cbd5e1" }}>Rental ID: <strong>{rental || "—"}</strong></div>
          <div style={{ color: "#cbd5e1" }}>Access Key: <strong>{key || "—"}</strong></div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
          <Link
            href={findUrl}
            style={{ background: "#2563eb", color: "white", padding: "10px 14px", borderRadius: 8, fontWeight: 700 }}
          >
            Open “Find My Rental”
          </Link>
          <Link
            href="/fleet"
            style={{ border: "1px solid #334155", padding: "10px 14px", borderRadius: 8, color: "#e5e7eb" }}
          >
            Back to Fleet
          </Link>
        </div>

        <p style={{ color: "#94a3b8", marginTop: 16 }}>
          Use these credentials in <em>Find My Rental</em> to check your booking status, dates, and details anytime.
        </p>
      </main>
      <Footer />
    </>
  );
}
