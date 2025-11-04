// pages/book/success.tsx
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";

export default function BookingSuccess() {
  const router = useRouter();
  const rental = (router.query.rental as string) || "";
  const name   = (router.query.name as string) || "";
  const email  = (router.query.email as string) || "";
  const key    = (router.query.key as string) || ""; // one-time reveal

  const findUrl = `/find?rental=${encodeURIComponent(rental)}&key=${encodeURIComponent(key)}`;

  return (
    <>
      <Head><title>Booking Confirmed • JLA</title></Head>
      <Nav />
      <main className="container" style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Thanks, {name || "there"}!</h1>
        <p style={{ color: "#cbd5e1", marginBottom: 16 }}>
          We received your request. We’ll email you at <strong>{email || "your email"}</strong> once it’s approved.
        </p>

        <div style={{ background: "#0b1220", border: "1px solid #1f2937", borderRadius: 10, padding: 16 }}>
          <div style={{ fontWeight: 700, color: "#e5e7eb", marginBottom: 8 }}>Your credentials</div>
          <div style={{ color: "#cbd5e1" }}>Rental ID: <strong>{rental}</strong></div>
          <div style={{ color: "#cbd5e1" }}>Access Key (one-time show): <strong>{key}</strong></div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
          <Link
            href={findUrl}
            style={{ background: "#2563eb", color: "white", padding: "10px 14px", borderRadius: 8, fontWeight: 700 }}
          >
            Open “Find My Rental”
          </Link>
          <Link href="/fleet" style={{ border: "1px solid #334155", padding: "10px 14px", borderRadius: 8, color: "#e5e7eb" }}>
            Back to Fleet
          </Link>
        </div>

        <p style={{ color: "#94a3b8", marginTop: 16 }}>
          Keep your Rental ID + Access Key in a safe place. You’ll need them to view your booking.
        </p>
      </main>
      <Footer />
    </>
  );
}
