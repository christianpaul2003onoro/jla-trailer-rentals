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
  const fired = useRef(false);

  useEffect(() => {
    const qp: Creds = {
      rental: (router.query.rental as string) || (router.query.rid as string) || "",
      key: (router.query.key as string) || "",
      name: (router.query.name as string) || "",
      email: (router.query.email as string) || "",
    };

    try {
      if (!(qp.rental && qp.key)) {
        const raw =
          (typeof window !== "undefined" && sessionStorage.getItem("jla_last_rental")) ||
          (typeof window !== "undefined" && localStorage.getItem("jla_last_rental"));
        if (raw) {
          const s = JSON.parse(raw) as Creds;
          setCreds({
            rental: s.rental || qp.rental || "",
            key: s.key || qp.key || "",
            name: s.name || qp.name || "",
            email: s.email || qp.email || "",
          });
          return;
        }
      }
    } catch {}
    setCreds(qp);
  }, [router.query]);

  useEffect(() => {
    const rid = creds.rental?.trim();
    if (!rid || fired.current) return;
    fired.current = true;
    // Fire-and-forget, no UI text:
    fetch("/api/bookings/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rental_id: rid }),
    }).catch(() => {});
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

        <div style={{ background: "#0b1220", border: "1px solid #1f2937", borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, color: "#e5e7eb", marginBottom: 8 }}>Your booking credentials</div>
          <div style={{ color: "#cbd5e1" }}>Rental ID: <strong>{rental || "—"}</strong></div>
          <div style={{ color: "#cbd5e1" }}>Access Key: <strong>{key || "—"}</strong></div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
          <Link href={findUrl} style={{ background: "#2563eb", color: "white", padding: "10px 14px", borderRadius: 8, fontWeight: 700 }}>
            Open “Find My Rental”
          </Link>
          <Link href="/fleet" style={{ border: "1px solid #334155", padding: "10px 14px", borderRadius: 8, color: "#e5e7eb" }}>
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
