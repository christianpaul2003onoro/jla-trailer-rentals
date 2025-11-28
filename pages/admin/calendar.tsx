// pages/admin/calendar.tsx
import { useEffect, useState } from "react";
import Head from "next/head";
import AdminLayout from "../../components/AdminLayout";

type AdminCalendarEvent = {
  id: string;
  rental_id: string | null;
  start_date: string;
  end_date: string;
  status: "Pending" | "Approved" | "Paid" | "Closed" | "Blocked";
  trailer_name: string | null;
  trailer_color_hex: string | null;
  client_name: string | null;
};

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDayLabel(date: Date) {
  return `${dayNames[date.getDay()]} ${date.getDate()}`;
}

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AdminCalendarPage() {
  const [events, setEvents] = useState<AdminCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startOffset, setStartOffset] = useState(0);   // days from today
  const [totalDays] = useState(28);                    // 4-week window

  const startDate = addDays(new Date(), startOffset);
  const endDate = addDays(startDate, totalDays - 1);

  const days: Date[] = [];
  for (let i = 0; i < totalDays; i++) {
    days.push(addDays(startDate, i));
  }

  async function loadEvents() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        start: toISODate(startDate),
        end: toISODate(endDate),
      });

      const resp = await fetch(`/api/admin/calendar?${params.toString()}`, {
        credentials: "include",
      });

      if (resp.status === 401) {
        window.location.href = "/admin/login";
        return;
      }

      const json = await resp.json();
      if (!resp.ok || json?.ok === false) {
        setError(json?.error || "Failed to load calendar.");
        setEvents([]);
      } else {
        setEvents(json.events ?? []);
      }
    } catch (e: any) {
      setError(e?.message || "Network error");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  // initial load + reload if window range changes
  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startOffset]);

  // manual “Sync now” → call import-from-google endpoint then reload
  async function handleSyncNow() {
    if (!window.confirm("Sync with Google Calendar now?")) return;

    try {
      const resp = await fetch("/api/admin/calendar/import-from-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ daysBack: 2, daysForward: 60 }),
      });

      const json = await resp.json().catch(() => ({} as any));
      if (!resp.ok || json?.ok === false) {
        alert(json?.error || "Sync failed.");
      } else {
        const created = json.created ?? 0;
        const skipped = json.skippedExisting ?? 0;
        const ignored = json.ignored ?? 0;
        alert(
          `Sync completed.\n\nCreated: ${created}\nExisting: ${skipped}\nIgnored: ${ignored}`
        );
        await loadEvents();
      }
    } catch (e: any) {
      alert(e?.message || "Network error during sync.");
    }
  }

  // group events by day for display
  const eventsByDay: Record<string, AdminCalendarEvent[]> = {};
  for (const ev of events) {
    let d = new Date(ev.start_date);
    const end = new Date(ev.end_date);
    while (d <= end) {
      const key = toISODate(d);
      if (!eventsByDay[key]) eventsByDay[key] = [];
      eventsByDay[key].push(ev);
      d = addDays(d, 1);
    }
  }

  return (
    <AdminLayout>
      <Head>
        <title>Admin • Calendar</title>
      </Head>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Calendar</h1>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={navBtn}
            onClick={() => setStartOffset((o) => o - 7)}
          >
            ◀ Previous week
          </button>
          <button
            style={navBtn}
            onClick={() => setStartOffset(0)}
          >
            Today
          </button>
          <button
            style={navBtn}
            onClick={() => setStartOffset((o) => o + 7)}
          >
            Next week ▶
          </button>

          <button style={syncBtn} onClick={handleSyncNow}>
            🔄 Sync now
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 8, color: "#9ca3af", fontSize: 14 }}>
        Showing{" "}
        <strong>
          {startDate.toLocaleDateString()} – {endDate.toLocaleDateString()}
        </strong>
        {loading && <span style={{ marginLeft: 8 }}>Loading…</span>}
      </div>

      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: 8,
            borderRadius: 8,
            background: "#451a1a",
            color: "#fecaca",
            border: "1px solid #b91c1c",
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${totalDays}, minmax(90px, 1fr))`,
          gap: 4,
          borderTop: "1px solid #1f2937",
          borderLeft: "1px solid #1f2937",
          overflowX: "auto",
        }}
      >
        {days.map((d) => {
          const key = toISODate(d);
          const list = eventsByDay[key] || [];
          return (
            <div
              key={key}
              style={{
                minHeight: 120,
                borderRight: "1px solid #1f2937",
                borderBottom: "1px solid #1f2937",
                padding: 4,
                fontSize: 12,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: 4,
                  color: "#e5e7eb",
                }}
              >
                {formatDayLabel(d)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {list.length === 0 ? (
                  <span style={{ color: "#6b7280", fontSize: 11 }}>—</span>
                ) : (
                  list.map((ev) => {
                    const color = ev.trailer_color_hex || "#374151";
                    const isBlocked = ev.status === "Blocked";
                    return (
                      <div
                        key={ev.id}
                        title={
                          isBlocked
                            ? `BLOCK — ${ev.trailer_name ?? "Trailer"}`
                            : `${ev.client_name ?? "Client"} • ${
                                ev.trailer_name ?? "Trailer"
                              } • ${ev.rental_id ?? ""}`
                        }
                        style={{
                          padding: "3px 4px",
                          borderRadius: 6,
                          background: color,
                          color: "#000",
                          fontSize: 11,
                          boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isBlocked ? (
                          <strong>BLOCK</strong>
                        ) : (
                          <strong>{ev.rental_id ?? "JLA-?????"}</strong>
                        )}
                        {" · "}
                        {ev.trailer_name ?? "Trailer"}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}

const navBtn: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: 6,
  border: "1px solid #374151",
  background: "#020617",
  color: "#e5e7eb",
  cursor: "pointer",
  fontSize: 12,
};

const syncBtn: React.CSSProperties = {
  ...navBtn,
  background: "#0f766e",
  borderColor: "#14b8a6",
};
