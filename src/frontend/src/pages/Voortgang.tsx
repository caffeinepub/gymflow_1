import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Dumbbell, TrendingUp, Weight } from "lucide-react";
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

interface SummaryCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color?: string;
}

function SummaryCard({ label, value, sub, icon, color }: SummaryCardProps) {
  return (
    <Card className="border-border bg-card flex-1 min-w-0">
      <CardContent className="p-4">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
            color ?? "bg-primary/15"
          }`}
        >
          {icon}
        </div>
        <p className="text-2xl font-display font-black text-foreground">
          {value}
        </p>
        <p className="text-xs text-muted-foreground font-medium mt-0.5">
          {label}
        </p>
        {sub && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function Voortgang() {
  const [localLogs] = useLocalStorage<WorkoutSession[]>("gymflow_logs", []);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("1");

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

  const exerciseChartData = useMemo(() => {
    const id = Number.parseInt(selectedExerciseId);
    const dataPoints: { date: string; maxGewicht: number }[] = [];
    for (const log of localLogs) {
      const ex = log.exercises.find((e) => Number(e.exerciseId) === id);
      if (ex && ex.sets.length > 0) {
        const maxWeight = Math.max(...ex.sets.map((s) => s.weight));
        if (maxWeight > 0) {
          dataPoints.push({
            date: formatDate(log.date),
            maxGewicht: maxWeight,
          });
        }
      }
    }
    return dataPoints.slice(-12);
  }, [localLogs, selectedExerciseId]);

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

  const loggedExerciseIds = useMemo(() => {
    const ids = new Set<number>();
    for (const log of localLogs) {
      for (const ex of log.exercises) {
        ids.add(Number(ex.exerciseId));
      }
    }
    for (const k of Object.keys(EXERCISES)) {
      ids.add(Number.parseInt(k));
    }
    return Array.from(ids).filter((id) => EXERCISES[id]);
  }, [localLogs]);

  const selectedExerciseName =
    EXERCISES[Number.parseInt(selectedExerciseId)]?.name ?? "Oefening";

  return (
    <div className="min-h-screen px-4 pt-8 pb-4">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display text-4xl font-black">Voortgang</h1>
        <p className="text-muted-foreground mt-1">Jouw trainingsresultaten</p>
      </motion.div>

      {/* Summary cards */}
      <div className="flex gap-3 mb-4">
        <SummaryCard
          label="Trainingen deze maand"
          value={workoutsThisMonth}
          icon={<Calendar size={18} className="text-primary" />}
          color="bg-primary/15"
        />
        <SummaryCard
          label="Volume deze week"
          value={`${Math.round((volumeThisWeek / 1000) * 10) / 10}t`}
          sub={`${Math.round(volumeThisWeek)} kg totaal`}
          icon={<Weight size={18} className="text-accent" />}
          color="bg-accent/15"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6"
      >
        <SummaryCard
          label="Totaal sessies gelogd"
          value={totalSessions}
          icon={<TrendingUp size={18} className="text-chart-3" />}
          color="bg-chart-3/15"
        />
      </motion.div>

      {/* Exercise progression chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card className="border-border bg-card" data-ocid="voortgang.card">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg">
              Gewichtsprogressie
            </CardTitle>
            <div className="mt-2">
              <Select
                value={selectedExerciseId}
                onValueChange={setSelectedExerciseId}
              >
                <SelectTrigger
                  className="w-full bg-background border-border h-10"
                  data-ocid="voortgang.select"
                >
                  <SelectValue placeholder="Kies oefening" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {loggedExerciseIds.map((id) => (
                    <SelectItem key={id} value={String(id)}>
                      {EXERCISES[id]?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {exerciseChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={exerciseChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.26 0.018 50)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "oklch(0.58 0.015 50)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "oklch(0.58 0.015 50)" }}
                    axisLine={false}
                    tickLine={false}
                    width={36}
                    tickFormatter={(v) => `${v}kg`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.16 0.012 50)",
                      border: "1px solid oklch(0.26 0.018 50)",
                      borderRadius: "8px",
                      color: "oklch(0.95 0.005 50)",
                    }}
                    formatter={(v: number) => [`${v} kg`, "Max gewicht"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="maxGewicht"
                    stroke="oklch(0.72 0.19 47)"
                    strokeWidth={2.5}
                    dot={{ fill: "oklch(0.72 0.19 47)", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div
                className="flex flex-col items-center justify-center h-[200px] text-muted-foreground"
                data-ocid="voortgang.empty_state"
              >
                <Dumbbell size={32} className="mb-2 opacity-30" />
                <p className="text-sm">
                  Nog geen data voor {selectedExerciseName}
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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <Card className="border-border bg-card" data-ocid="voortgang.panel">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg">
              Volume per spiergroep
            </CardTitle>
            <p className="text-xs text-muted-foreground">Deze week</p>
          </CardHeader>
          <CardContent className="pt-0">
            {muscleGroupVolume.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={muscleGroupVolume} margin={{ left: -10 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.26 0.018 50)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "oklch(0.58 0.015 50)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "oklch(0.58 0.015 50)" }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    tickFormatter={(v) => `${v}kg`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.16 0.012 50)",
                      border: "1px solid oklch(0.26 0.018 50)",
                      borderRadius: "8px",
                      color: "oklch(0.95 0.005 50)",
                    }}
                    formatter={(v: number) => [`${v} kg`, "Volume"]}
                  />
                  <Bar
                    dataKey="volume"
                    fill="oklch(0.72 0.19 47)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div
                className="flex flex-col items-center justify-center h-[200px] text-muted-foreground"
                data-ocid="voortgang.empty_state"
              >
                <TrendingUp size={32} className="mb-2 opacity-30" />
                <p className="text-sm">Nog geen data deze week</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent sessions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-display text-lg font-bold mb-3">Recente sessies</h2>
        {recentSessions.length > 0 ? (
          <div className="space-y-2" data-ocid="voortgang.list">
            {recentSessions.map((session, i) => (
              <Card
                key={`${session.date}-${i}`}
                className="border-border bg-card"
                data-ocid={`voortgang.item.${i + 1}`}
              >
                <CardContent className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <Dumbbell size={16} className="text-muted-foreground" />
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
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div
            className="text-center py-10 text-muted-foreground"
            data-ocid="voortgang.empty_state"
          >
            <Calendar size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nog geen sessies gelogd</p>
            <p className="text-xs mt-1 opacity-70">
              Start je eerste training op de Vandaag pagina
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
