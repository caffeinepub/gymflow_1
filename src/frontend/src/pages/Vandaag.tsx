import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Dumbbell, Moon, Wind, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import type { WorkoutSession } from "../backend";
import { useWorkoutContext } from "../contexts/WorkoutContext";
import {
  DEFAULT_SCHEDULE,
  EXERCISES,
  type ExerciseOption,
  type ScheduleDay,
} from "../data/exercises";
import { useLocalStorage } from "../hooks/useLocalStorage";

const DAY_NAMES = [
  "Zondag",
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
];

function getTodayScheduleIndex(): number {
  const jsDay = new Date().getDay();
  return (jsDay + 6) % 7;
}

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function DayTypeBadge({ type }: { type: string }) {
  if (type === "kracht")
    return (
      <Badge className="bg-primary/20 text-primary border-primary/40 font-semibold">
        <Zap size={12} className="mr-1" /> Kracht
      </Badge>
    );
  if (type === "cardio")
    return (
      <Badge className="bg-accent/20 text-accent border-accent/40 font-semibold">
        <Wind size={12} className="mr-1" /> Cardio
      </Badge>
    );
  return (
    <Badge className="bg-muted text-muted-foreground border-border font-semibold">
      <Moon size={12} className="mr-1" /> Rust
    </Badge>
  );
}

function EquipmentBadge({ equipment }: { equipment: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
      {equipment}
    </span>
  );
}

export function Vandaag() {
  const navigate = useNavigate();
  const { startWorkout } = useWorkoutContext();
  const [swaps] = useLocalStorage<Record<string, ExerciseOption>>(
    "gymflow_swaps",
    {},
  );
  const [dayTypeOverrides] = useLocalStorage<Record<number, string>>(
    "gymflow_day_types",
    {},
  );
  const [localLogs] = useLocalStorage<WorkoutSession[]>("gymflow_logs", []);

  const todayIndex = getTodayScheduleIndex();
  const todayDateStr = getTodayDateString();
  const jsDay = new Date().getDay();
  const todayName = DAY_NAMES[jsDay];

  const scheduleDay: ScheduleDay = useMemo(() => {
    const base = DEFAULT_SCHEDULE[todayIndex];
    const overriddenType = dayTypeOverrides[todayIndex];
    return overriddenType
      ? { ...base, type: overriddenType as ScheduleDay["type"] }
      : base;
  }, [todayIndex, dayTypeOverrides]);

  const activeExercises: ExerciseOption[] = useMemo(() => {
    return scheduleDay.exerciseIds.map((id, slotIndex) => {
      const swapKey = `${todayIndex}-${slotIndex}`;
      return swaps[swapKey] ?? EXERCISES[id];
    });
  }, [scheduleDay, todayIndex, swaps]);

  const alreadyLogged = useMemo(() => {
    return localLogs.some((log) => log.date === todayDateStr);
  }, [localLogs, todayDateStr]);

  function handleStartWorkout() {
    startWorkout({
      exercises: activeExercises,
      dayName: todayName,
      dayLabel: scheduleDay.label,
      dayType: scheduleDay.type,
    });
    navigate({ to: "/workout" });
  }

  return (
    <div className="min-h-screen px-4 pt-8 pb-4">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest mb-1">
          {todayDateStr}
        </p>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl font-black text-foreground">
            {todayName}
          </h1>
          <DayTypeBadge type={scheduleDay.type} />
        </div>
        {scheduleDay.label !== "Rust" && (
          <p className="text-muted-foreground mt-1 font-medium">
            {scheduleDay.label}
          </p>
        )}
      </motion.div>

      {alreadyLogged && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/30 px-4 py-3"
          data-ocid="vandaag.success_state"
        >
          <CheckCircle2 size={20} className="text-primary shrink-0" />
          <p className="text-sm text-primary font-semibold">
            Vandaag al gelogd! Goed bezig 💪
          </p>
        </motion.div>
      )}

      {scheduleDay.type === "rust" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col items-center justify-center py-16 text-center"
          data-ocid="vandaag.panel"
        >
          <div className="text-6xl mb-4">😴</div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Rustdag
          </h2>
          <p className="text-muted-foreground max-w-xs">
            Herstel is net zo belangrijk als trainen. Geniet van je vrije dag!
          </p>
        </motion.div>
      )}

      {scheduleDay.type === "cardio" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          data-ocid="vandaag.section"
        >
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest mb-3">
            Cardio opties
          </p>
          <div className="space-y-3 mb-6">
            {activeExercises.map((ex, i) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
              >
                <Card
                  className="border-border bg-card"
                  data-ocid={`vandaag.item.${i + 1}`}
                >
                  <CardContent className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                      <Wind size={18} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ex.equipment}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <Button
            size="lg"
            className="w-full h-14 font-display text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90 glow-accent"
            onClick={handleStartWorkout}
            data-ocid="vandaag.primary_button"
          >
            <Wind size={20} className="mr-2" /> Start Cardio
          </Button>
        </motion.div>
      )}

      {scheduleDay.type === "kracht" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          data-ocid="vandaag.section"
        >
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest mb-3">
            Oefeningen — {activeExercises.length} exercises
          </p>
          <div className="space-y-3 mb-6">
            {activeExercises.map((ex, i) => (
              <motion.div
                key={`${ex.id}-${i}`}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.07 }}
              >
                <Card
                  className="border-border bg-card"
                  data-ocid={`vandaag.item.${i + 1}`}
                >
                  <CardContent className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-display font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {ex.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {ex.muscleGroup}
                      </p>
                    </div>
                    <EquipmentBadge equipment={ex.equipment} />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <Button
            size="lg"
            className="w-full h-14 font-display text-lg font-bold glow-primary"
            onClick={handleStartWorkout}
            disabled={alreadyLogged}
            data-ocid="vandaag.primary_button"
          >
            <Dumbbell size={20} className="mr-2" />
            {alreadyLogged ? "Vandaag al gelogd" : "Start Training"}
          </Button>
        </motion.div>
      )}

      <footer className="mt-10 text-center text-xs text-muted-foreground/50">
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
