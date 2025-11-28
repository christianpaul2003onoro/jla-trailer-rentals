// pages/admin/calendar/index.tsx
import { useEffect, useMemo, useState } from "react";
import type React from "react";
import Head from "next/head";
import AdminLayout from "../../components/AdminLayout";

type AdminCalendarEvent = {
  id: string;
  rental_id: string;
  start_date: string; // "YYYY-MM-DD"
  end_date: string;   // "YYYY-MM-DD" (inclusive)
  status: "Pending" | "Approved" | "Paid" | "Closed" | "Blocked";
  trailer_name: string | null;
  trailer_color_hex: string | null;
};

type WeekDayCell = {
  date: Date;
  ymd: string;
  inMonth: boolean;
};

// ----- tiny date helpers (work in local time, but all day-only) -----

function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d);
}

function ymdFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function buildMonthMatrix(viewDate: Date): WeekDayCell[][] {
  const firstOfMonth = startOfMonth(viewDate);
  const monthIdx = firstOfMonth.getMonth();

  // Start grid on the Sunday of the week that includes the 1st
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay()); // Sunday

  const weeks: WeekDayCell[][] = [];
  let cursor = gridStart;

  for (let w = 0; w < 6; w++) {
    const row: WeekDayCell[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(cursor);
      row.push({
        date: d,
        ymd: ymdFromDate(d),
        inMonth: d.getMonth() === monthIdx,
      });
      cursor = addDays(cursor, 1);
    }
    weeks.push(row);
  }

  // Optional: trim last empty week if entirely outside the month
  if (weeks[5].every((c) => !c.inMonth)) {
    weeks.pop();
  }

  return weeks;
}

// Represent an event segment that lives within a single week row
type WeekSegment = {
  id: string;
  rental_id: string;
  title: string;
  startCol: number; // 1-based CSS grid column start
  span: number;     // column span
  color: string;
};

export default function AdminCalendarPage() {
  const [events, setEvents] = useState<AdminCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Month we’re looking at (anchor date = first day of month)
  const [viewDate, setViewDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  async function loadEvents() {
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

      const json = await resp.json();
      if (!resp.ok || json?.ok === false) {
        setError(json?.error || "Failed to load calendar events.");
        setEvents([]);
      } else {
        setEvents(json?.events ?? []);
      }
    } catch (e: any) {
      setError(e?.message || "Network error while loading events.");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  // “Sync now” – pulls from Google and then reloads
  async function syncNow() {
    try {
      const resp = await fetch("/api/admin/calendar/import-from-google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ daysBack: 7, daysForward: 90 }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || json?.ok === false) {
        alert(json?.error || "Sync failed.");
      } else {
        await loadEvents();
      }
    } catch (e: any) {
      alert(e?.message || "Sync failed.");
    }
  }

  const weeks = useMemo(() => buildMonthMatrix(viewDate), [viewDate]);

  // Pre-compute numeric day indices to build segments cleanly
  const segmentsByWeek: WeekSegment[][] = useMemo(() => {
    if (!weeks.length) return [];

    // Helper to convert "YYYY-MM-DD" → day index number
    const dayIndex = (ymd: string): number => {
      const d = parseYMD(ymd);
      return Math.floor(d.getTime() / 86400000);
    };

    return weeks.map((week) => {
      const weekStartIdx = dayIndex(week[0].ymd);
      const weekEndIdx = dayIndex(week[6].ymd);

      const segments: WeekSegment[] = [];

      for (const ev of events) {
        const evStartIdx = dayIndex(ev.start_date);
        const evEndIdx = dayIndex(ev.end_date); // inclusive

        // If event does not overlap this week, skip
        if (evEndIdx < weekStartIdx || evStartIdx > weekEndIdx) continue;

        const segStartIdx = Math.max(evStartIdx, weekStartIdx);
        const segEndIdx = Math.min(evEndIdx, weekEndIdx);

        const startCol = segStartIdx - weekStartIdx + 1; // 1-based
        const span = segEndIdx - segStartIdx + 1;

        const labelTrailer = ev.trailer_name ? ` · ${ev.trailer_name}` : "";
        const title = `${ev.rental_id}${labelTrailer}`;

        segments.push({
          id: `${ev.id}-${weekStartIdx}`, // unique per week
          rental_id: ev.rental_id,
          title,
          startCol,
          span,
          color: ev.trailer_color_hex || "#4b5563",
        });
      }

      return segments;
    });
  }, [weeks, events]);

  const monthLabel = useMemo(() => {
    return viewDate.toLocaleString(undefined, {
      month: "long",
      year: "numeric",
    });
  }, [viewDate]);

  function goPrevMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goNextMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function goToday() {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  return (
    <AdminLayout>
      <Head>
        <title>Admin • Calendar</title>
      </Head>

      <h1 style={{ fontSize: 28, margin: "8px 0 16px" }}>Calendar</h1>

      {/* Top controls */}
      <div style={controlsRow}>
        <div style={{ fontWeight: 600, fontSize: 18 }}>{monthLabel}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btn} onClick={goPrevMonth}>
            ◀ Previous month
          </button>
          <button style={btn} onClick={goToday}>
            Today
          </button>
          <button style={btn} onClick={goNextMonth}>
            Next month ▶
          </button>
          <button style={primaryBtn} onClick={syncNow}>
            🔄 Sync now
          </button>
        </div>
      </div>

      {error && (
        <div style={errorBox}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div style={monthGridOuter}>
          {/* Day-of-week header */}
          <div style={dowHeader}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} style={dowCell}>
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div style={weeksContainer}>
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} style={weekRow}>
                {/* Day cells row */}
                <div style={weekDayCellsRow}>
                  {week.map((cell) => (
                    <div
                      key={cell.ymd}
                      style={{
                        ...dayCell,
                        opacity: cell.inMonth ? 1 : 0.35,
                      }}
                    >
                      <div style={dayNumber}>{cell.date.getDate()}</div>
                    </div>
                  ))}
                </div>

                {/* Events row – 7-column grid, segments span multiple days */}
                <div style={weekEventsRow}>
                  {segmentsByWeek[weekIdx]?.map((seg) => (
                    <div
                      key={seg.id}
                      style={{
                        ...eventBar,
                        gridColumn: `${seg.startCol} / span ${seg.span}`,
                        background: seg.color,
                      }}
                      title={seg.title}
                    >
                      {seg.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

/* ------- styles ------- */

const controlsRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const btn: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #374151",
  background: "#111827",
  color: "#e5e7eb",
  cursor: "pointer",
  fontSize: 13,
};

const primaryBtn: React.CSSProperties = {
  ...btn,
  background: "#059669",
  borderColor: "#047857",
};

const errorBox: React.CSSProperties = {
  background: "#451a1a",
  border: "1px solid #fecaca",
  color: "#fecaca",
  padding: "8px 10px",
  borderRadius: 8,
  marginBottom: 12,
  fontSize: 13,
};

const monthGridOuter: React.CSSProperties = {
  background: "#020617",
  borderRadius: 12,
  border: "1px solid #111827",
  padding: 8,
};

const dowHeader: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  fontSize: 12,
  color: "#9ca3af",
  marginBottom: 4,
};

const dowCell: React.CSSProperties = {
  padding: "4px 6px",
  textAlign: "left",
};

const weeksContainer: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const weekRow: React.CSSProperties = {
  borderTop: "1px solid #111827",
  paddingTop: 2,
  paddingBottom: 6,
};

const weekDayCellsRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 1,
};

const dayCell: React.CSSProperties = {
  minHeight: 46,
  borderRadius: 6,
  border: "1px solid #111827",
  background: "#020617",
  padding: "2px 4px",
};

const dayNumber: React.CSSProperties = {
  fontSize: 11,
  color: "#e5e7eb",
};

const weekEventsRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 3,
  marginTop: 4,
};

const eventBar: React.CSSProperties = {
  fontSize: 11,
  color: "#0b1120",
  borderRadius: 999,
  padding: "2px 6px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

