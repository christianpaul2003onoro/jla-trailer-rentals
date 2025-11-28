// pages/admin/calendar.tsx
import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import AdminLayout from "../../components/AdminLayout";

type RawEvent = {
  id: string;
  rental_id?: string | null;
  rentalId?: string | null;
  start_date?: string;
  end_date?: string;
  startDate?: string;
  endDate?: string;
  trailer_name?: string | null;
  trailerName?: string | null;
  color_hex?: string | null;
  trailer_color_hex?: string | null;
  colorHex?: string | null;
  status?: string | null;
};

type CalendarEvent = {
  id: string;
  label: string;
  start: Date;
  end: Date;
  color: string;
};

type Week = Date[];

// ---------- date helpers ----------
function startOfDay(d: Date) {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}

function addDays(d: Date, n: number) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}

function startOfMonth(d: Date) {
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));
}

function endOfMonth(d: Date) {
  return startOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

function startOfWeekSunday(d: Date) {
  const s = startOfDay(d);
  const diff = s.getDay(); // 0 = Sun
  return addDays(s, -diff);
}

function endOfWeekSunday(d: Date) {
  const s = startOfWeekSunday(d);
  return addDays(s, 6);
}

function formatMonthHeader(d: Date) {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ---------- normalize events coming from API ----------
function normalizeEvents(raw: RawEvent[]): CalendarEvent[] {
  return raw
    .map((e) => {
      const startISO = e.startDate ?? e.start_date;
      const endISO = e.endDate ?? e.end_date ?? startISO;
      if (!startISO || !endISO) return null;

      const start = startOfDay(new Date(startISO));
      const end = startOfDay(new Date(endISO));

      const rentalId = e.rentalId ?? e.rental_id ?? "";
      const trailerName = e.trailerName ?? e.trailer_name ?? "";
      const baseLabel = rentalId || trailerName || "Booking";

      const label =
        rentalId && trailerName
          ? `${rentalId} • ${trailerName}`
          : baseLabel;

      const color =
        e.colorHex ??
        e.trailer_color_hex ??
        e.color_hex ??
        "#6b7280"; // default gray

      return {
        id: e.id,
        label,
        start,
        end,
        color,
      } as CalendarEvent;
    })
    .filter((x): x is CalendarEvent => !!x);
}

// Build weeks between calendarStart and calendarEnd
function buildWeeks(calendarStart: Date, calendarEnd: Date): Week[] {
  const weeks: Week[] = [];
  let cursor = startOfWeekSunday(calendarStart);
  while (cursor <= calendarEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(addDays(cursor, i));
    }
    weeks.push(week);
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

// ---------- React page ----------
export default function AdminCalendarPage() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const today = useMemo(() => startOfDay(new Date()), []);

  const activeMonth = useMemo(() => {
    const base = new Date();
    return new Date(base.getFullYear(), base.getMonth() + monthOffset, 1);
  }, [monthOffset]);

  const monthStart = useMemo(() => startOfMonth(activeMonth), [activeMonth]);
  const monthEnd = useMemo(() => endOfMonth(activeMonth), [activeMonth]);
  const calendarStart = useMemo(
    () => startOfWeekSunday(monthStart),
    [monthStart]
  );
  const calendarEnd = useMemo(
    () => endOfWeekSunday(monthEnd),
    [monthEnd]
  );

  const weeks = useMemo(
    () => buildWeeks(calendarStart, calendarEnd),
    [calendarStart, calendarEnd]
  );

  // Fetch events once on mount (backend already limits range)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch("/api/admin/calendar/events", {
          credentials: "include",
        });

        if (resp.status === 401) {
          window.location.href = "/admin/login";
          return;
        }

        const text = await resp.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Unexpected response from server.");
        }

        if (!resp.ok || data?.ok === false) {
          throw new Error(data?.error || "Failed to load calendar events.");
        }

        const rawEvents: RawEvent[] = data.events ?? data.rows ?? [];
        const normalized = normalizeEvents(rawEvents);

        if (!cancelled) {
          setEvents(normalized);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Network error while loading events.");
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Manual “Sync now” – hits the import endpoint, then refreshes events
  async function handleSyncNow() {
    setSyncing(true);
    try {
      await fetch("/api/admin/calendar/import-from-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ daysBack: 2, daysForward: 90 }),
      }).catch(() => undefined);

      // After import, refetch events
      const resp = await fetch("/api/admin/calendar/events", {
        credentials: "include",
      });
      const json = await resp.json().catch(() => ({} as any));
      if (resp.ok && json?.events) {
        setEvents(normalizeEvents(json.events));
      }
    } finally {
      setSyncing(false);
    }
  }

  // For each week, build segments that stay inside that week and span columns
  function getWeekSegments(week: Week) {
    const weekStart = week[0];
    const weekEnd = week[6];

    return events
      .filter((ev) => ev.end >= weekStart && ev.start <= weekEnd)
      .map((ev) => {
        const segStart = ev.start < weekStart ? weekStart : ev.start;
        const segEnd = ev.end > weekEnd ? weekEnd : ev.end;

        const startCol = segStart.getDay() + 1; // 1–7
        const endCol = segEnd.getDay() + 1;

        return {
          id: ev.id + "_" + startCol + "_" + endCol,
          label: ev.label,
          color: ev.color,
          startCol,
          endCol,
        };
      });
  }

  return (
    <AdminLayout>
      <Head>
        <title>Admin • Calendar</title>
      </Head>

      <h1 style={{ fontSize: 28, margin: "8px 0 4px" }}>Calendar</h1>
      <div style={{ color: "#9ca3af", marginBottom: 16 }}>
        {formatMonthHeader(activeMonth)}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            style={navButton}
            onClick={() => setMonthOffset((m) => m - 1)}
          >
            ◀ Previous month
          </button>
          <button style={navButton} onClick={() => setMonthOffset(0)}>
            Today
          </button>
          <button
            style={navButton}
            onClick={() => setMonthOffset((m) => m + 1)}
          >
            Next month ▶
          </button>
        </div>

        <button
          style={{
            ...navButton,
            background: "#16a34a",
            borderColor: "#15803d",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          onClick={handleSyncNow}
          disabled={syncing}
        >
          {syncing ? "Syncing…" : "🔄 Sync now"}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 10px",
            borderRadius: 8,
            background: "#451a1a",
            color: "#fecaca",
            border: "1px solid #b91c1c",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          borderRadius: 12,
          border: "1px solid #1f2933",
          overflow: "hidden",
          background: "#020617",
        }}
      >
        {/* day-of-week header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            background: "#020617",
            borderBottom: "1px solid #111827",
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              style={{
                padding: "8px 10px",
                fontSize: 12,
                color: "#9ca3af",
                textAlign: "left",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* weeks */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {weeks.map((week, wi) => {
            const segments = getWeekSegments(week);

            return (
              <div
                key={wi}
                style={{
                  borderTop: wi === 0 ? "none" : "1px solid #111827",
                  padding: "2px 0 10px",
                }}
              >
                {/* day cells */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                    minHeight: 70,
                  }}
                >
                  {week.map((day, di) => {
                    const inMonth =
                      day.getMonth() === activeMonth.getMonth();
                    const isToday = isSameDay(day, today);

                    return (
                      <div
                        key={di}
                        style={{
                          borderRight:
                            di === 6 ? "none" : "1px solid #111827",
                          padding: "4px 6px",
                          position: "relative",
                          background: "#020617",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: inMonth ? "#e5e7eb" : "#4b5563",
                            textAlign: "right",
                          }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              minWidth: 18,
                              height: 18,
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: 999,
                              background: isToday ? "#2563eb" : "transparent",
                              color: isToday ? "white" : undefined,
                            }}
                          >
                            {day.getDate()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* event bars for this week */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                    gridAutoRows: "1.3rem",
                    gap: 2,
                    padding: "2px 4px 0",
                  }}
                >
                  {segments.map((seg) => (
                    <div
                      key={seg.id}
                      style={{
                        gridColumn: `${seg.startCol} / ${seg.endCol + 1}`,
                        background: seg.color,
                        borderRadius: 999,
                        padding: "0 6px",
                        fontSize: 11,
                        color: "#020617",
                        display: "flex",
                        alignItems: "center",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        border: "1px solid rgba(15,23,42,0.35)",
                      }}
                    >
                      {seg.label}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ padding: 10, fontSize: 13, color: "#9ca3af" }}>
              Loading…
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

const navButton: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #374151",
  background: "#020617",
  color: "#e5e7eb",
  fontSize: 13,
  cursor: "pointer",
};
