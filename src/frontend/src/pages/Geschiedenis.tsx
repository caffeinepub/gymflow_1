import { Activity, ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { WorkoutSession } from "../backend";
import { useLocalStorage } from "../hooks/useLocalStorage";

const MAANDEN = [
  "Januari",
  "Februari",
  "Maart",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Augustus",
  "September",
  "Oktober",
  "November",
  "December",
];
const DAGEN_KORT = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

function getDayOfWeekMon(date: Date): number {
  return (date.getDay() + 6) % 7;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function Geschiedenis() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [sessions] = useLocalStorage<WorkoutSession[]>("gymflow_logs", []);

  const sessionMap = useMemo(() => {
    const map: Record<string, WorkoutSession> = {};
    for (const s of sessions) {
      map[s.date] = s;
    }
    return map;
  }, [sessions]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const offset = getDayOfWeekMon(firstDay);
    const days: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(currentYear, currentMonth, d));
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [currentYear, currentMonth]);

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(null);
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(null);
  }

  const todayStr = toDateString(today);
  const selectedSession = selectedDay ? sessionMap[selectedDay] : null;

  return (
    <div className="px-3 py-4 max-w-lg mx-auto">
      <div className="mb-4">
        <h1 className="text-xl font-bold font-display text-foreground tracking-tight">
          Geschiedenis
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Overzicht van gelogde trainingen per maand
        </p>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3 bg-card rounded-xl px-3 py-2 border border-border">
        <button
          type="button"
          data-ocid="geschiedenis.pagination_prev"
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Vorige maand"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold font-display text-foreground tracking-wide">
          {MAANDEN[currentMonth]} {currentYear}
        </span>
        <button
          type="button"
          data-ocid="geschiedenis.pagination_next"
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Volgende maand"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-3">
        <div className="grid grid-cols-7 border-b border-border">
          {DAGEN_KORT.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-semibold text-muted-foreground py-2 uppercase tracking-widest"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((date, idx) => {
            if (!date) {
              // biome-ignore lint/suspicious/noArrayIndexKey: empty filler cells have no identity
              return <div key={`empty-${idx}`} className="h-10" />;
            }
            const dateStr = toDateString(date);
            const session = sessionMap[dateStr];
            const isToday = dateStr === todayStr;
            const isFuture = dateStr > todayStr;
            const isSelected = dateStr === selectedDay;
            const dayNum = date.getDate();

            let dotColor = "";
            if (session) {
              dotColor =
                session.dayType === "kracht"
                  ? "bg-primary"
                  : session.dayType === "cardio"
                    ? "bg-blue-400"
                    : "";
            }

            return (
              <button
                key={dateStr}
                type="button"
                data-ocid={`geschiedenis.day_button.${dayNum}`}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={[
                  "relative h-10 flex flex-col items-center justify-center gap-0.5 transition-all duration-150",
                  isSelected ? "bg-primary/20" : "hover:bg-secondary/60",
                  isFuture ? "opacity-30" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-xs font-medium leading-none",
                    isToday ? "text-primary font-bold" : "text-foreground",
                    isSelected ? "text-primary" : "",
                  ].join(" ")}
                >
                  {dayNum}
                </span>
                {dotColor && (
                  <span className={`w-1 h-1 rounded-full ${dotColor}`} />
                )}
                {isToday && (
                  <span className="absolute inset-0 rounded-sm ring-1 ring-primary ring-inset pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-[10px] text-muted-foreground">Kracht</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-[10px] text-muted-foreground">Cardio</span>
        </div>
      </div>

      {/* Summary panel */}
      <AnimatePresence mode="wait">
        {selectedDay && (
          <motion.div
            key={selectedDay}
            data-ocid="geschiedenis.summary_panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border rounded-xl overflow-hidden mb-3"
          >
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
              {selectedSession?.dayType === "cardio" ? (
                <Activity size={14} className="text-blue-400 shrink-0" />
              ) : (
                <Dumbbell size={14} className="text-primary shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold font-display text-foreground">
                  {new Date(`${selectedDay}T12:00:00`).toLocaleDateString(
                    "nl-NL",
                    {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    },
                  )}
                </p>
                {selectedSession && (
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {selectedSession.dayType === "kracht"
                      ? "Krachttraining"
                      : selectedSession.dayType === "cardio"
                        ? "Cardio"
                        : "Rust"}
                  </p>
                )}
              </div>
            </div>

            {selectedSession && selectedSession.exercises.length > 0 ? (
              <div className="divide-y divide-border">
                {selectedSession.exercises.map((ex) => (
                  <div key={ex.exerciseName} className="px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground">
                        {ex.exerciseName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {ex.sets.length} sets
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {ex.sets.map((set, si) => (
                        <span
                          key={`${set.weight}-${String(set.reps)}-${si}`}
                          className="text-[10px] bg-secondary text-secondary-foreground rounded px-1.5 py-0.5 font-mono"
                        >
                          {set.weight}kg × {String(set.reps)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedSession && selectedSession.dayType === "cardio" ? (
              <div className="px-3 py-4 text-center">
                <Activity size={20} className="text-blue-400 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">
                  Cardiosessie gelogd
                </p>
              </div>
            ) : (
              <div
                data-ocid="geschiedenis.empty_state"
                className="px-3 py-6 text-center"
              >
                <p className="text-xs text-muted-foreground">
                  Geen training gelogd
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <MonthlySummary
        sessions={sessions}
        year={currentYear}
        month={currentMonth}
      />
    </div>
  );
}

function MonthlySummary({
  sessions,
  year,
  month,
}: {
  sessions: WorkoutSession[];
  year: number;
  month: number;
}) {
  const monthSessions = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
    return sessions.filter((s) => s.date.startsWith(prefix));
  }, [sessions, year, month]);

  const kracht = monthSessions.filter((s) => s.dayType === "kracht").length;
  const cardio = monthSessions.filter((s) => s.dayType === "cardio").length;
  const totalExercises = monthSessions.reduce(
    (acc, s) => acc + s.exercises.length,
    0,
  );
  const totalSets = monthSessions.reduce(
    (acc, s) => acc + s.exercises.reduce((a, e) => a + e.sets.length, 0),
    0,
  );

  if (monthSessions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-3 bg-card border border-border rounded-xl px-3 py-3"
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
        Maandoverzicht
      </p>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Trainingen", value: monthSessions.length },
          { label: "Kracht", value: kracht },
          { label: "Cardio", value: cardio },
          { label: "Sets", value: totalSets },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-lg font-bold font-display text-primary">
              {value}
            </p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
          </div>
        ))}
      </div>
      {totalExercises > 0 && (
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          {totalExercises} oefeningen uitgevoerd
        </p>
      )}
    </motion.div>
  );
}
