// pages/admin/calendar.tsx
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import AdminLayout from "../../components/AdminLayout";

type AdminCalendarEvent = {
  id: string;
  rental_id: string;
  status: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  customerName: string;
  trailerName: string | null;
  trailerColorHex: string | null;
  delivery_requested: boolean;
};

type StatusColor = {
  bg: string;
  border: string;
};

const statusColors: Record<string, StatusColor> = {
  Pending: { bg: "rgba(251, 191, 36, 0.18)", border: "#fbbf24" },
  Approved: { bg: "rgba(59, 130, 246, 0.18)", border: "#60a5fa" },
  Paid: { bg: "rgba(22, 163, 74, 0.18)", border: "#4ade80" },
  Closed: { bg: "rgba(107, 114, 128, 0.18)", border: "#9ca3af" },
};

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function startOfGrid(d: Date): Date {
  const first = startOfMonth(d);
  const day = first.getDay(); // 0 = Sun
  const grid = new Date(first);
  grid.setDate(first.getDate() - day);
  return grid;
}

function endOfGrid(d: Date): Date {
  const last = endOfMonth(d);
  const day = last.getDay();
  const grid = new Date(last);
  grid.setDate(last.getDate() + (6 - day));
  return grid;
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWithinRange(day: Date, start: string, end: string) {
  const ds = new Date(start + "T00:00:00");
  const de = new Date(end + "T23:59:59");
  return day >= ds && day <= de;
}

export default function AdminCalendarPage() {
  const [events, setEvents] = useState<AdminCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());

  async function loadEvents() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        daysBack: "60",
        daysForward: "90",
      });
      const resp = await fetch(`/api/admin/calendar/events?${params.toString()}`, {
        credentials: "include",
      });
      if (resp.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const json = await resp.json();
      if (!resp.ok || json?.ok === false) {
        alert(json?.error || "Failed to load calendar events.");
        setEvents([]);
      } else {
        setEvents(json.events ?? []);
      }
    } catch (e: any) {
      alert(e?.message || "Network error while loading calendar.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function runManualSync() {
    if (syncing) return;
    const ok = window.confirm(
      "Run a manual sync from Google Calendar now?\n\n" +
        "This will import new events (phone bookings / blocks) for ~60 days."
    );
    if (!ok) return;

    setSyncing(true);
    try {
      const resp = await fetch("/api/admin/calendar/import-from-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ daysBack: 7, daysForward: 60 }),
      });
      const json = await resp.json().catch(() => ({} as any));

      if (!resp.ok || json?.ok === false) {
        alert(json?.error || "Sync failed.");
      } else {
        const msg =
          `Sync finished.\n\n` +
          `Created: ${json.created ?? 0}\n` +
          `Existing skipped: ${json.skippedExisting ?? 0}\n` +
          `Ignored: ${json.ignored ?? 0}`;
        alert(msg);
        await loadEvents();
      }
    } catch (e: any) {
      alert(e?.message || "Network error while syncing.");
    } finally {
      setSyncing(false);
    }
  }

  const today = useMemo(() => new Date(), []);
  const gridStart = startOfGrid(currentMonth);
  const gridEnd = endOfGrid(currentMonth);

  const days: Date[] = [];
  for (
    let d = new Date(gridStart);
    d <= gridEnd;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  ) {
    days.push(d);
  }

  function eventsForDay(day: Date) {
    return events.filter((ev) => isWithinRange(day, ev.start_date, ev.end_date));
  }

  function monthLabel(d: Date) {
    return d.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }

  return (
    <AdminLayout>
      <Head>
        <title>Admin • Calendar</title>
      </Head>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 28, margin: 0 }}>Calendar</h1>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            style={navBtn}
            onClick={() =>
              setCurrentMonth(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
              )
            }
          >
            ‹
          </button>
          <div style={{ minWidth: 160, textAlign: "center", fontWeight: 600 }}>
            {monthLabel(currentMonth)}
          </div>
          <button
            style={navBtn}
            onClick={() =>
              setCurrentMonth(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
              )
            }
          >
            ›
          </button>

          <button
            style={todayBtn}
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </button>

          <button
            style={{
              ...syncBtn,
              opacity: syncing ? 0.6 : 1,
              cursor: syncing ? "default" : "pointer",
            }}
            onClick={runManualSync}
            disabled={syncing}
          >
            {syncing ? "Syncing…" : "Sync from Google now"}
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading calendar…</p>
      ) : (
        <div style={{ borderRadius: 12, border: "1px solid #1f2933", overflow: "hidden" }}>
          {/* Weekday header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              background: "#111827",
              borderBottom: "1px solid #1f2933",
            }}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                style={{
                  padding: "8px 10px",
                  fontSize: 12,
                  textTransform: "uppercase",
                  color: "#9ca3af",
                  letterSpacing: 0.08,
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              background: "#020617",
            }}
          >
            {days.map((day, idx) => {
              const isCurrentMonth =
                day.getMonth() === currentMonth.getMonth() &&
                day.getFullYear() === currentMonth.getFullYear();

              const isToday = isSameDay(day, today);
              const dayEvents = eventsForDay(day);

              return (
                <div
                  key={idx}
                  style={{
                    minHeight: 92,
                    borderRight:
                      (idx + 1) % 7 === 0 ? "none" : "1px solid #111827",
                    borderBottom: "1px solid #111827",
                    background: isCurrentMonth ? "#020617" : "#020617",
                    opacity: isCurrentMonth ? 1 : 0.55,
                    padding: 6,
                    position: "relative",
                    fontSize: 11,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: isToday ? "#f97316" : "#e5e7eb",
                        fontWeight: isToday ? 700 : 500,
                      }}
                    >
                      {day.getDate()}
                    </span>
                  </div>

                  <div style={{ display: "grid", gap: 3 }}>
                    {dayEvents.map((ev) => {
                      const statusStyle =
                        statusColors[ev.status] ??
                        statusColors["Pending"];

                      const pillColor =
                        ev.trailerColorHex || statusStyle.border;

                      return (
                        <div
                          key={ev.id + toDateOnly(day)}
                          title={`${ev.customerName} · ${ev.trailerName ?? "Trailer"} · ${
                            ev.rental_id
                          } (${ev.status})`}
                          style={{
                            borderRadius: 999,
                            padding: "2px 7px",
                            fontSize: 10,
                            lineHeight: 1.2,
                            backgroundColor: statusStyle.bg,
                            border: `1px solid ${pillColor}`,
                            color: "#e5e7eb",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              backgroundColor: pillColor,
                              marginRight: 4,
                            }}
                          />
                          {ev.trailerName ?? "Trailer"} · {ev.rental_id}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Small legend */}
      <div style={{ marginTop: 14, fontSize: 11, color: "#9ca3af" }}>
        <strong style={{ color: "#e5e7eb" }}>Legend:</strong>{" "}
        <span style={{ marginRight: 10 }}>Border color = trailer color</span>
        <span style={{ marginRight: 10 }}>Yellow = Pending</span>
        <span style={{ marginRight: 10 }}>Blue = Approved</span>
        <span style={{ marginRight: 10 }}>Green = Paid</span>
        <span>Gray = Closed</span>
      </div>
    </AdminLayout>
  );
}

const navBtn: React.CSSProperties = {
  borderRadius: 999,
  width: 28,
  height: 28,
  border: "1px solid #374151",
  background: "#020617",
  color: "#e5e7eb",
  cursor: "pointer",
};

const todayBtn: React.CSSProperties = {
  borderRadius: 999,
  padding: "5px 10px",
  border: "1px solid #374151",
  background: "#020617",
  color: "#e5e7eb",
  cursor: "pointer",
  fontSize: 12,
};

const syncBtn: React.CSSProperties = {
  borderRadius: 999,
  padding: "6px 14px",
  border: "1px solid #4b5563",
  background:
    "linear-gradient(135deg, rgba(56,189,248,0.18), rgba(59,130,246,0.25))",
  color: "#e5e7eb",
  fontSize: 12,
  fontWeight: 500,
};
