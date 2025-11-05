// pages/book/index.tsx
// Booking form with live availability check using /api/availability
// Uses only relative imports (no "@/"), and posts exact keys your /api/book expects.

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

import Nav from "../../components/Nav";
import Footer from "../../components/Footer";
import { supabase } from "../../lib/supabaseClient";

// ---------- helpers ----------
function parseYMD(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function daysBetween(a: string, b: string) {
  if (!a || !b) return 0;
  const A = parseYMD(a);
  const B = parseYMD(b);
  const ms = Math.max(0, B.getTime() - A.getTime());
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

type TrailerPick = { id: string; name: string; rate_per_day: number };
type Conflict = { startDate: string; endDate: string };

export default function BookPage() {
  const router = useRouter();

  // ---------- form state ----------
  const [trailers, setTrailers] = useState<TrailerPick[]>([]);
  const [trailerId, setTrailerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [delivery, setDelivery] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [comments, setComments] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // ---------- availability state ----------
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  // ---------- load trailers once ----------
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("trailers")
        .select("id,name,rate_per_day")
        .eq("active", true)
        .order("name", { ascending: true });
      if (!error && data) setTrailers(data as TrailerPick[]);
    })();
  }, []);

  // ---------- preselect trailer from ?trailer= ----------
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query?.trailer as string | undefined;
    if (q) setTrailerId(q);
  }, [router.isReady, router.query]);

  // ---------- derived pricing ----------
  const selected = useMemo(
    () => trailers.find((t) => t.id === trailerId),
    [trailers, trailerId]
  );
  const dayCount = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);
  const base = useMemo(
    () => (selected ? selected.rate_per_day * dayCount : 0),
    [selected, dayCount]
  );
  const total = base; // delivery is informational only

  // ---------- availability check ----------
  useEffect(() => {
    let t: NodeJS.Timeout | null = null;

    async function check() {
      if (!trailerId || !startDate || !endDate) {
        setIsAvailable(null);
        setConflicts([]);
        setCheckingAvail(false);
        return;
      }

      setCheckingAvail(true);
      setIsAvailable(null);
      setConflicts([]);

      try {
        const resp = await fetch("/api/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trailerId, startDate, endDate }),
        });
        const json = await resp.json();
        if (!resp.ok || !json.ok) {
          setIsAvailable(null);
          setConflicts([]);
        } else {
          setIsAvailable(Boolean(json.available));
          const list: Conflict[] = (json.conflicts || []).map((c: any) => ({
            startDate: c.startDate,
            endDate: c.endDate,
          }));
          setConflicts(list);
        }
      } catch {
        setIsAvailable(null);
        setConflicts([]);
      } finally {
        setCheckingAvail(false);
      }
    }

    t = setTimeout(check, 250);
    return () => {
      if (t) clearTimeout(t);
    };
  }, [trailerId, startDate, endDate]);

  // ---------- validation ----------
  function validate() {
    const e: Record<string, string> = {};
    if (!trailerId) e.trailerId = "Please select a trailer.";
    if (!startDate) e.startDate = "Choose a start date.";
    if (!endDate) e.endDate = "Choose an end date.";
    if (!firstName.trim()) e.firstName = "Enter your first name.";
    if (!lastName.trim()) e.lastName = "Enter your last name.";
    if (!email.trim()) e.email = "Enter your email.";
    if (!phone.trim()) e.phone = "Enter your phone.";

    if (isAvailable === false)
      e.dates = "Those dates are not available for this trailer. Please choose a different range.";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ---------- submit ----------
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    // Payload uses EXACT keys your /api/book expects.
    const payload = {
      trailer_id: trailerId,
      start_date: startDate,
      end_date: endDate,
      pickup_time: pickupTime || null,
      return_time: returnTime || null,
      delivery_requested: delivery,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      towing_vehicle: vehicle,
      comments,
    };

    try {
      const resp = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await resp.json();

      if (!resp.ok || !json.ok) {
        if (json?.field) setErrors((p) => ({ ...p, [json.field]: json.error }));
        else setFormError(json?.error || "Could not create booking.");
        return;
      }

      // Success → redirect with rental + key + name + email, and save for refresh
      const payloadForSuccess = {
        rental: json.rental_id,
        key: json.access_key,
        name: `${firstName} ${lastName}`.trim(),
        email,
      };
      if (typeof window !== "undefined") {
        sessionStorage.setItem("jla_last_rental", JSON.stringify(payloadForSuccess));
      }
      const qs = new URLSearchParams(payloadForSuccess);
      router.push(`/book/success?${qs.toString()}`);

    } catch (err: any) {
      setFormError(err?.message || "Network error. Please try again.");
    }
  }

  // ---------- styles ----------
  const inputStyle: React.CSSProperties = {
    padding: 10,
    borderRadius: 8,
    background: "#0b1220",
    color: "#e5e7eb",
    border: "1px solid "#1f2937"",
    colorScheme: "dark",
  } as React.CSSProperties;
  const todayStr = new Date().toISOString().slice(0, 10);

  // ---------- UI ----------
  return (
    <>
      <Head><title>Book a Trailer • JLA Trailer Rentals</title></Head>
      <Nav />

      <main style={{ maxWidth: 1100, margin: "32px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 8, color: "#e5e7eb" }}>
          Book a Trailer
        </h1>
        <p style={{ color: "#cbd5e1", marginBottom: 22 }}>
          Choose a trailer, pick your dates, and fill your info. We’ll confirm by email. Delivery available —{" "}
          <strong>$2.50/mile traveled</strong> (estimate provided after billing).
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {/* Trailer */}
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "#e5e7eb", fontWeight: 600 }}>Trailer</span>
            <select value={trailerId} onChange={(e) => setTrailerId(e.target.value)} style={inputStyle}>
              <option value="">Select a trailer...</option>
              {trailers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {errors.trailerId && <small style={{ color: "#fca5a5" }}>{errors.trailerId}</small>}
          </label>

          {/* Dates */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ color: "#e5e7eb", fontWeight: 600 }}>Start Date</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} min={todayStr} />
              {errors.startDate && <small style={{ color: "#fca5a5" }}>{errors.startDate}</small>}
            </label>
            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ color: "#e5e7eb", fontWeight: 600 }}>End Date</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} min={startDate || todayStr} />
              {errors.endDate && <small style={{ color: "#fca5a5" }}>{errors.endDate}</small>}
            </label>

            {/* Availability banner (spans both date columns) */}
            <div style={{ gridColumn: "1 / span 2" }}>
              {checkingAvail && <div style={{ color: "#93c5fd" }}>Checking availability…</div>}

              {!checkingAvail && isAvailable === true && startDate && endDate && (
                <div style={{ color: "#86efac" }}>✅ Those dates are available.</div>
              )}

              {!checkingAvail && isAvailable === false && (
                <div
                  style={{
                    color: "#fecaca",
                    background: "#7f1d1d",
                    border: "1px solid #ef4444",
                    borderRadius: 8,
                    padding: "8px 10px",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    Those dates are not available for this trailer.
                  </div>
                  {conflicts.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {conflicts.map((c, i) => (
                        <li key={i}>
                          Unavailable from {c.startDate} to {c.endDate}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Times */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ color: "#e5e7eb", fontWeight: 600 }}>Pickup Time</span>
              <input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} style={inputStyle} />
            </label>
            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ color: "#e5e7eb", fontWeight: 600 }}>Return Time</span>
              <input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} style={inputStyle} />
            </label>
          </div>

          {/* Delivery (info only) */}
          <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" checked={delivery} onChange={(e) => setDelivery(e.target.checked)} />
            <span style={{ color: "#e5e7eb" }}>
              Request delivery <span style={{ color: "#93c5fd", fontWeight: 600 }}>$2.50/mile traveled</span>{" "}
              <span style={{ color: "#94a3b8" }}>(estimate provided after billing)</span>
            </span>
          </label>

          {/* Names */}
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "#e5e7eb", fontWeight: 600 }}>First Name</span>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Your first name" style={inputStyle} />
            {errors.firstName && <small style={{ color: "#fca5a5" }}>{errors.firstName}</small>}
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "#e5e7eb", fontWeight: 600 }}>Last Name</span>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Your last name" style={inputStyle} />
            {errors.lastName && <small style={{ color: "#fca5a5" }}>{errors.lastName}</small>}
          </label>

          {/* Contact */}
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "#e5e7eb", fontWeight: 600 }}>Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(786) 760-6175" style={inputStyle} />
            {errors.phone && <small style={{ color: "#fca5a5" }}>{errors.phone}</small>}
          </label>
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "#e5e7eb", fontWeight: 600 }}>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
            {errors.email && <small style={{ color: "#fca5a5" }}>{errors.email}</small>}
          </label>

          {/* Vehicle */}
          <label style={{ display: "grid", gap: 8 }}>
            <span style={{ color: "#e5e7eb", fontWeight: 600 }}>Towing Vehicle</span>
            <input value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="e.g., Ford F-150" style={inputStyle} />
          </label>

          {/* Notes */}
          <label style={{ gridColumn: "1 / span 1", display: "grid", gap: 8 }}>
            <span style={{ color: "#e5e7eb", fontWeight: 600 }}>Additional Comments</span>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Any details we should know?"
              rows={5}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </label>

          {/* Quote preview */}
          <div
            style={{
              gridColumn: "2 / span 1",
              background: "#0b1220",
              border: "1px solid #1f2937",
              borderRadius: 10,
              padding: 16,
            }}
          >
            <div style={{ color: "#e5e7eb", fontWeight: 700, marginBottom: 8 }}>Quote preview</div>
            <div style={{ color: "#cbd5e1" }}>Days: {dayCount}</div>
            <div style={{ color: "#cbd5e1" }}>Daily rate: ${selected?.rate_per_day ?? 0}</div>
            <div style={{ color: "#e5e7eb", fontWeight: 700 }}>Base: ${base.toFixed(2)}</div>
            <div style={{ color: "#cbd5e1" }}>
              Delivery (est.): <strong>$2.50/mile traveled</strong> — <em>TBD</em>
            </div>
            <div style={{ color: "#e5e7eb", fontWeight: 800, marginTop: 6 }}>
              Total est.: ${total.toFixed(2)}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, gridColumn: "1 / span 2" }}>
            <button
              type="submit"
              disabled={checkingAvail || isAvailable === false}
              style={{
                background: "#2563eb",
                border: "1px solid #1e40af",
                padding: "10px 14px",
                borderRadius: 8,
                color: "white",
                fontWeight: 700,
                opacity: checkingAvail || isAvailable === false ? 0.6 : 1,
                cursor: checkingAvail || isAvailable === false ? "not-allowed" : "pointer",
              }}
            >
              {checkingAvail ? "Checking…" : "Confirm & Book"}
            </button>
            <Link
              href="/fleet"
              style={{ border: "1px solid #334155", padding: "10px 14px", borderRadius: 8, color: "#e5e7eb" }}
            >
              Back to Fleet
            </Link>
          </div>

          {errors.dates && (
            <div style={{ gridColumn: "1 / span 2", color: "#fca5a5" }}>{errors.dates}</div>
          )}
          {formError && (
            <div style={{ gridColumn: "1 / span 2", color: "#fca5a5" }}>{formError}</div>
          )}
        </form>
      </main>

      <Footer />
    </>
  );
}
