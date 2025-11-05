// pages/book/success.tsx
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";

type Creds = { rental: string; key: string; name?: string; email?: string };

export default function BookingSuccess() {
  const router = useRouter();
  const [creds, setCreds] = useState<Creds | null>(null);

  useEffect(() => {
    // From query
    const qRental = typeof router.query.rental === "string" ? router.query.rental : "";
    const qKey = typeof router.query.key === "string" ? router.query.key : "";
    const qName = typeof router.query.name === "string" ? router.query.name : "";
    const qEmail = typeof router.query.email === "string" ? router.query.email : "";

    if (qRental && qKey) {
      const v = { rental: qRental, key: qKey, name: qName, email: qEmail };
      setCreds(v);
      if (typeof window !== "undefined")
        sessionStorage.setItem("jla_last_rental", JSON.stringify(v));
      return;
    }

    // Fallback: sessionStorage
    try {
      const raw = sessionStorage.getItem("jla_last_rental");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.rental && parsed?.key) setCreds(parsed);
      }
    } catch {}
  }, [router.query]);

  const findUrl = creds
    ? `/find?rental=${encodeURIComponent(creds.rental)}&key=${encodeURIComponent(creds.key)}`
    : "/find";

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  }

  return (
    <>
      <Head><title>Booking Confirmation • JLA Trailer Rentals</title></Head>
      <Nav />

      <main
        className="container"
        style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}
      >
        <h1
          style={{
            fontSize: 36,
            fontWeight: 800,
            marginBottom: 10,
            color: "#e5e7eb",
          }}
        >
          Thanks{creds?.name ? `, ${creds.name}` : ", there"}!
        </h1>

        <p style={{ color: "#cbd5e1", marginBottom: 20, lineHeight: 1.6 }}>
          We’ve received your booking! A confirmation email was sent to{" "}
          <strong>{creds?.email || "your email"}</strong> along with your{" "}
          <strong>Rental ID</strong> and <strong>Access Key</strong>. <br />
          You’ll hear from us once your request is approved.
        </p>

        <div
          style={{
            background: "#0b1220",
            border: "1px solid #1f2937",
            borderRadius: 12,
            padding: 18,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "#e5e7eb",
              marginBottom: 10,
              fontSize: 16,
            }}
          >
            Your booking credentials
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#cbd5e1",
              }}
            >
              <span>Rental ID:</span>
              <strong>{creds?.rental || "—"}</strong>
              {creds?.rental && (
                <button
                  type="button"
                  onClick={() => copy(creds.rental)}
                  style={{
                    marginLeft: "auto",
                    border: "1px solid #334155",
                    color: "#e5e7eb",
                    background: "transparent",
                    padding: "4px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Copy
                </button>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#cbd5e1",
              }}
            >
              <span>Access Key:</span>
              <strong>{creds?.key || "—"}</strong>
              {creds?.key && (
                <button
                  type="button"
                  onClick={() => copy(creds.key)}
                  style={{
                    marginLeft: "auto",
                    border: "1px solid #334155",
                    color: "#e5e7eb",
                    background: "transparent",
                    padding: "4px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Copy
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href={findUrl}
            style={{
              background: "#2563eb",
              color: "white",
              padding: "10px 16px",
              borderRadius: 8,
              fontWeight: 700,
            }}
          >
            Open “Find My Rental”
          </Link>
          <Link
            href="/fleet"
            style={{
              border: "1px solid #334155",
              padding: "10px 16px",
              borderRadius: 8,
              color: "#e5e7eb",
              fontWeight: 500,
            }}
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
