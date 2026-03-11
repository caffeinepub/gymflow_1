import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Dumbbell, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WorkoutSession } from "../backend";
import { EXERCISES } from "../data/exercises";
import { useLocalStorage } from "../hooks/useLocalStorage";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split("T")[0];
}

function getMonthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

type Metric = "gewicht" | "herhalingen";

export function Voortgang() {
  const [localLogs] = useLocalStorage<WorkoutSession[]>("gymflow_logs", []);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("1");
  const [selectedMetric, setSelectedMetric] = useState<Metric>("gewicht");

  const weekStart = getWeekStart();
  const monthStart = getMonthStart();

  const workoutsThisMonth = useMemo(() => {
    return localLogs.filter((log) => log.date >= monthStart).length;
  }, [localLogs, monthStart]);

  const volumeThisWeek = useMemo(() => {
    let total = 0;
    for (const log of localLogs) {
      if (log.date < weekStart) continue;
      for (const ex of log.exercises) {
        for (const set of ex.sets) {
          total += set.weight * Number(set.reps);
        }
      }
    }
    return total;
  }, [localLogs, weekStart]);

  const totalSessions = localLogs.length;

  // Build combined exercise list: known exercises + custom ones from logs
  const exerciseOptions = useMemo(() => {
    const options: { key: string; label: string }[] = [];
    const seenNames = new Set<string>();

    // Known exercises logged or in EXERCISES
    const knownIds = new Set<number>();
    for (const log of localLogs) {
      for (const ex of log.exercises) {
        knownIds.add(Number(ex.exerciseId));
      }
    }
    for (const k of Object.keys(EXERCISES)) {
      knownIds.add(Number.parseInt(k));
    }
    for (const id of Array.from(knownIds).filter((id) => EXERCISES[id])) {
      options.push({ key: String(id), label: EXERCISES[id].name });
      seenNames.add(EXERCISES[id].name.toLowerCase());
    }

    // Custom exercises from logs not matching known EXERCISES
    for (const log of localLogs) {
      for (const ex of log.exercises) {
        const name = ex.exerciseName;
        if (name && !seenNames.has(name.toLowerCase())) {
          options.push({ key: `custom:${name}`, label: name });
          seenNames.add(name.toLowerCase());
        }
      }
    }

    return options;
  }, [localLogs]);

  const exerciseChartData = useMemo(() => {
    const isCustom = selectedExerciseId.startsWith("custom:");
    const customName = isCustom ? selectedExerciseId.slice(7) : null;
    const numericId = isCustom ? null : Number.parseInt(selectedExerciseId);

    const dataPoints: { date: string; value: number }[] = [];

    for (const log of localLogs) {
      let ex: import("../backend").ExerciseLog | undefined;
      if (isCustom) {
        ex = log.exercises.find(
          (e) => e.exerciseName?.toLowerCase() === customName?.toLowerCase(),
        );
      } else {
        ex = log.exercises.find((e) => Number(e.exerciseId) === numericId);
      }

      if (ex && ex.sets.length > 0) {
        let value: number;
        if (selectedMetric === "gewicht") {
          value = Math.max(...ex.sets.map((s) => s.weight));
          if (value <= 0) continue;
        } else {
          value = Math.max(...ex.sets.map((s) => Number(s.reps)));
          if (value <= 0) continue;
        }
        dataPoints.push({ date: formatDate(log.date), value });
      }
    }

    return dataPoints.slice(-12);
  }, [localLogs, selectedExerciseId, selectedMetric]);

  const muscleGroupVolume = useMemo(() => {
    const volumes: Record<string, number> = {};
    for (const log of localLogs) {
      if (log.date < weekStart) continue;
      for (const ex of log.exercises) {
        const exercise = EXERCISES[Number(ex.exerciseId)];
        const group = exercise?.muscleGroup ?? ex.exerciseName;
        const vol = ex.sets.reduce(
          (s, set) => s + set.weight * Number(set.reps),
          0,
        );
        volumes[group] = (volumes[group] ?? 0) + vol;
      }
    }
    return Object.entries(volumes)
      .map(([name, volume]) => ({ name, volume: Math.round(volume) }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 8);
  }, [localLogs, weekStart]);

  const recentSessions = useMemo(() => {
    return [...localLogs].reverse().slice(0, 5);
  }, [localLogs]);

  const selectedExerciseLabel =
    exerciseOptions.find((o) => o.key === selectedExerciseId)?.label ??
    "Oefening";

  const yAxisFormatter = (v: number) =>
    selectedMetric === "gewicht" ? `${v}kg` : `${v}`;
  const tooltipFormatter = (v: number): [string, string] =>
    selectedMetric === "gewicht"
      ? [`${v} kg`, "Max gewicht"]
      : [`${v} reps`, "Max herhalingen"];

  return (
    <div className="min-h-screen px-4 pt-6 pb-4 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <h1 className="font-display text-3xl font-black">Voortgang</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Jouw trainingsresultaten
        </p>
      </motion.div>

      {/* Compact stat row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-0 mb-4 rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="flex flex-col px-4 py-3 flex-1 border-r border-border">
          <span className="text-xl font-display font-black text-foreground">
            {workoutsThisMonth}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            Trainingen deze maand
          </span>
        </div>
        <div className="flex flex-col px-4 py-3 flex-1 border-r border-border">
          <span className="text-xl font-display font-black text-primary">
            {Math.round((volumeThisWeek / 1000) * 10) / 10}t
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            Volume deze week
          </span>
        </div>
        <div className="flex flex-col px-4 py-3 flex-1">
          <span className="text-xl font-display font-black text-foreground">
            {totalSessions}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            Totaal sessies
          </span>
        </div>
      </motion.div>

      {/* Exercise progression chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-4"
      >
        <Card className="border-border bg-card" data-ocid="voortgang.card">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="font-display text-base">
              Progressie per oefening
            </CardTitle>

            {/* Metric toggle */}
            <div
              className="flex gap-1 mt-2 p-1 rounded-full bg-secondary w-fit"
              data-ocid="voortgang.metric.toggle"
            >
              <button
                type="button"
                onClick={() => setSelectedMetric("gewicht")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                  selectedMetric === "gewicht"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid="voortgang.toggle"
              >
                Max gewicht
              </button>
              <button
                type="button"
                onClick={() => setSelectedMetric("herhalingen")}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
                  selectedMetric === "herhalingen"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid="voortgang.toggle"
              >
                Max herhalingen
              </button>
            </div>

            <div className="mt-2">
              <Select
                value={selectedExerciseId}
                onValueChange={setSelectedExerciseId}
              >
                <SelectTrigger
                  className="w-full bg-background border-border h-8 text-sm"
                  data-ocid="voortgang.select"
                >
                  <SelectValue placeholder="Kies oefening" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {exerciseOptions.map((opt) => (
                    <SelectItem key={opt.key} value={opt.key}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            {exerciseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={exerciseChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.22 0.012 255)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "oklch(0.48 0.012 255)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "oklch(0.48 0.012 255)" }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                    tickFormatter={yAxisFormatter}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.12 0.012 255)",
                      border: "1px solid oklch(0.20 0.012 255)",
                      borderRadius: "8px",
                      color: "oklch(0.95 0.008 85)",
                      fontSize: "12px",
                    }}
                    formatter={(v: number) => tooltipFormatter(v)}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="oklch(0.78 0.12 88)"
                    strokeWidth={2.5}
                    dot={{ fill: "oklch(0.78 0.12 88)", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div
                className="flex flex-col items-center justify-center h-[180px] text-muted-foreground"
                data-ocid="voortgang.empty_state"
              >
                <Dumbbell size={28} className="mb-2 opacity-30" />
                <p className="text-sm">
                  Nog geen data voor {selectedExerciseLabel}
                </p>
                <p className="text-xs mt-1 opacity-70">
                  Start een training om progressie bij te houden
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Volume per muscle group */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-4"
      >
        <Card className="border-border bg-card" data-ocid="voortgang.panel">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="font-display text-base">
              Volume per spiergroep
            </CardTitle>
            <p className="text-xs text-muted-foreground">Deze week</p>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0">
            {muscleGroupVolume.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={muscleGroupVolume} margin={{ left: -10 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.22 0.012 255)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: "oklch(0.48 0.012 255)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "oklch(0.48 0.012 255)" }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                    tickFormatter={(v) => `${v}kg`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.12 0.012 255)",
                      border: "1px solid oklch(0.20 0.012 255)",
                      borderRadius: "8px",
                      color: "oklch(0.95 0.008 85)",
                      fontSize: "12px",
                    }}
                    formatter={(v: number) => [`${v} kg`, "Volume"]}
                  />
                  <Bar
                    dataKey="volume"
                    fill="oklch(0.78 0.12 88)"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div
                className="flex flex-col items-center justify-center h-[180px] text-muted-foreground"
                data-ocid="voortgang.empty_state"
              >
                <TrendingUp size={28} className="mb-2 opacity-30" />
                <p className="text-sm">Nog geen data deze week</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent sessions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-display text-base font-bold mb-2">
          Recente sessies
        </h2>
        {recentSessions.length > 0 ? (
          <div
            className="rounded-xl border border-border bg-card overflow-hidden"
            data-ocid="voortgang.list"
          >
            {recentSessions.map((session, i) => (
              <div
                key={`${session.date}-${i}`}
                className="flex items-center gap-3 px-3 py-2.5 border-b border-border/40 last:border-0"
                data-ocid={`voortgang.item.${i + 1}`}
              >
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <Dumbbell size={13} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">
                    {session.date}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {session.exercises.length} oefeningen ·{" "}
                    {session.dayType === "kracht"
                      ? "Kracht"
                      : session.dayType === "cardio"
                        ? "Cardio"
                        : "Rust"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">
                    {session.exercises
                      .reduce(
                        (t, ex) =>
                          t +
                          ex.sets.reduce(
                            (s, set) => s + set.weight * Number(set.reps),
                            0,
                          ),
                        0,
                      )
                      .toFixed(0)}{" "}
                    kg
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="text-center py-8 text-muted-foreground"
            data-ocid="voortgang.empty_state"
          >
            <Calendar size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nog geen sessies gelogd</p>
            <p className="text-xs mt-1 opacity-70">
              Start je eerste training op de Vandaag pagina
            </p>
          </div>
        )}
      </motion.div>

      <footer className="mt-8 text-center text-xs text-muted-foreground/40">
        © {new Date().getFullYear()}. Gebouwd met ❤️ via{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
