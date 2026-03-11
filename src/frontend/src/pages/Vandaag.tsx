import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  KRACHT_LABELS,
  type ScheduleDay,
  getExerciseIdsByKrachtType,
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

const CARDIO_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: "fietsen", label: "Fietsen", emoji: "🚴" },
  { value: "lopen", label: "Lopen", emoji: "🏃" },
  { value: "stairmaster", label: "Stairmaster", emoji: "🪜" },
  { value: "handmatig", label: "Handmatig", emoji: "✏️" },
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
      <Badge className="bg-primary/20 text-primary border-primary/40 font-semibold text-[11px] px-2 py-0.5">
        <Zap size={10} className="mr-1" /> Kracht
      </Badge>
    );
  if (type === "cardio")
    return (
      <Badge className="bg-accent/20 text-accent border-accent/40 font-semibold text-[11px] px-2 py-0.5">
        <Wind size={10} className="mr-1" /> Cardio
      </Badge>
    );
  return (
    <Badge className="bg-muted text-muted-foreground border-border font-semibold text-[11px] px-2 py-0.5">
      <Moon size={10} className="mr-1" /> Rust
    </Badge>
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
  const [krachtTypeOverrides] = useLocalStorage<Record<number, string>>(
    "gymflow_kracht_types",
    {},
  );
  const [cardioTypeOverrides] = useLocalStorage<Record<number, string>>(
    "gymflow_cardio_types",
    {},
  );
  const [cardioHandmatig] = useLocalStorage<Record<number, string>>(
    "gymflow_cardio_handmatig",
    {},
  );
  const [localLogs] = useLocalStorage<WorkoutSession[]>("gymflow_logs", []);
  const [dayExerciseOrders] = useLocalStorage<Record<number, ExerciseOption[]>>(
    "gymflow_day_exercise_orders",
    {},
  );
  const [extraExercises] = useLocalStorage<Record<number, ExerciseOption[]>>(
    "gymflow_extra_exercises",
    {},
  );

  const todayIndex = getTodayScheduleIndex();
  const todayDateStr = getTodayDateString();
  const jsDay = new Date().getDay();
  const todayName = DAY_NAMES[jsDay];

  const scheduleDay: ScheduleDay = useMemo(() => {
    const base = DEFAULT_SCHEDULE[todayIndex];
    const overriddenType = dayTypeOverrides[todayIndex];
    const resolvedType = overriddenType ?? base.type;

    if (resolvedType === "kracht") {
      const krachtType = krachtTypeOverrides[todayIndex];
      if (krachtType) {
        return {
          ...base,
          type: "kracht",
          label: KRACHT_LABELS[krachtType] ?? base.label,
          exerciseIds: getExerciseIdsByKrachtType(krachtType),
        };
      }
    }

    return overriddenType
      ? { ...base, type: overriddenType as ScheduleDay["type"] }
      : base;
  }, [todayIndex, dayTypeOverrides, krachtTypeOverrides]);

  const activeExercises: ExerciseOption[] = useMemo(() => {
    const customOrder = dayExerciseOrders[todayIndex];
    const main: ExerciseOption[] =
      customOrder && customOrder.length > 0
        ? customOrder
        : scheduleDay.exerciseIds.map((id, slotIndex) => {
            const swapKey = `${todayIndex}-${slotIndex}`;
            return swaps[swapKey] ?? EXERCISES[id];
          });
    const extra = extraExercises[todayIndex] ?? [];
    return [...main, ...extra];
  }, [scheduleDay, todayIndex, swaps, dayExerciseOrders, extraExercises]);

  const alreadyLogged = useMemo(() => {
    return localLogs.some((log) => log.date === todayDateStr);
  }, [localLogs, todayDateStr]);

  const selectedCardioType = cardioTypeOverrides[todayIndex];
  const cardioOption = CARDIO_OPTIONS.find(
    (o) => o.value === selectedCardioType,
  );
  const cardioLabel = useMemo(() => {
    if (!selectedCardioType) return null;
    if (selectedCardioType === "handmatig") {
      const custom = cardioHandmatig[todayIndex];
      return custom ? `✏️ ${custom}` : null;
    }
    return cardioOption ? `${cardioOption.emoji} ${cardioOption.label}` : null;
  }, [selectedCardioType, cardioOption, cardioHandmatig, todayIndex]);

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
    <div className="min-h-screen px-4 pt-6 pb-4 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-5"
      >
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest mb-0.5">
          {todayDateStr}
        </p>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-black text-foreground">
            {todayName}
          </h1>
          <DayTypeBadge type={scheduleDay.type} />
        </div>
        {scheduleDay.label !== "Rust" && (
          <p className="text-muted-foreground text-sm mt-0.5">
            {scheduleDay.label}
          </p>
        )}
      </motion.div>

      {alreadyLogged && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-3 flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/30 px-3 py-2"
          data-ocid="vandaag.success_state"
        >
          <CheckCircle2 size={16} className="text-primary shrink-0" />
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
          <div className="text-5xl mb-3">😴</div>
          <h2 className="font-display text-xl font-bold text-foreground mb-1">
            Rustdag
          </h2>
          <p className="text-muted-foreground text-sm max-w-xs">
            Herstel is net zo belangrijk als trainen. Geniet van je vrije dag!
          </p>
        </motion.div>
      )}

      {scheduleDay.type === "cardio" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          data-ocid="vandaag.section"
        >
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest mb-2">
            Cardio sessie
          </p>

          {cardioLabel && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2.5 mb-4"
              data-ocid="vandaag.cardio.card"
            >
              <Wind size={14} className="text-accent shrink-0" />
              <span className="text-sm font-semibold text-accent">
                Gekozen activiteit:
              </span>
              <span className="text-sm font-bold text-foreground">
                {cardioLabel}
              </span>
            </motion.div>
          )}

          {activeExercises.length > 0 && (
            <div className="rounded-xl border border-border bg-card mb-4 overflow-hidden">
              {activeExercises.map((ex, i) => (
                <motion.div
                  key={ex.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + i * 0.06 }}
                  className="flex items-center gap-3 py-2.5 px-3 border-b border-border/40 last:border-0"
                  data-ocid={`vandaag.item.${i + 1}`}
                >
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <Wind size={11} className="text-accent" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-foreground">
                    {ex.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ex.equipment}
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          <Button
            size="default"
            className="w-full font-display font-bold bg-accent text-accent-foreground hover:bg-accent/90 glow-accent"
            onClick={handleStartWorkout}
            data-ocid="vandaag.primary_button"
          >
            <Wind size={16} className="mr-2" /> Start Cardio
          </Button>
        </motion.div>
      )}

      {scheduleDay.type === "kracht" && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          data-ocid="vandaag.section"
        >
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest mb-2">
            Oefeningen — {activeExercises.length} exercises
          </p>
          <div className="rounded-xl border border-border bg-card mb-4 overflow-hidden">
            {activeExercises.map((ex, pos) => (
              <motion.div
                key={`${ex?.id}-${pos}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + pos * 0.05 }}
                className="flex items-center gap-3 py-2.5 px-3 border-b border-border/40 last:border-0"
                data-ocid={`vandaag.item.${pos + 1}`}
              >
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary font-display font-bold text-[10px]">
                  {pos + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-foreground truncate block">
                    {ex?.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {ex?.muscleGroup}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium shrink-0">
                  {ex?.equipment}
                </span>
              </motion.div>
            ))}
          </div>
          <Button
            size="default"
            className="w-full font-display font-bold glow-primary"
            onClick={handleStartWorkout}
            disabled={alreadyLogged}
            data-ocid="vandaag.primary_button"
          >
            <Dumbbell size={16} className="mr-2" />
            {alreadyLogged ? "Vandaag al gelogd" : "Start Training"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
