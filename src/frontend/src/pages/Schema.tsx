import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Moon, Wind, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  DEFAULT_SCHEDULE,
  EXERCISES,
  type ExerciseOption,
  type ScheduleDay,
} from "../data/exercises";
import { useLocalStorage } from "../hooks/useLocalStorage";

function getTodayScheduleIndex(): number {
  return (new Date().getDay() + 6) % 7;
}

function DayTypePill({ type }: { type: string }) {
  if (type === "kracht")
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
        <Zap size={11} /> Kracht
      </span>
    );
  if (type === "cardio")
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent font-semibold">
        <Wind size={11} /> Cardio
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
      <Moon size={11} /> Rust
    </span>
  );
}

interface DayCardProps {
  day: ScheduleDay;
  isToday: boolean;
  exercises: ExerciseOption[];
  expanded: boolean;
  onToggle: () => void;
  index: number;
}

function DayCard({
  day,
  isToday,
  exercises,
  expanded,
  onToggle,
  index,
}: DayCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Card
        className={`border transition-all ${
          isToday
            ? "border-primary/60 bg-primary/5 exercise-card-active"
            : "border-border bg-card"
        }`}
        data-ocid={`schema.item.${index + 1}`}
      >
        <button
          type="button"
          className="w-full text-left px-4 py-3 flex items-center gap-3 min-h-[56px]"
          onClick={onToggle}
          data-ocid={`schema.toggle.${index + 1}`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-display font-black text-sm ${
              isToday
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {day.shortName}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`font-display font-bold ${
                  isToday ? "text-primary" : "text-foreground"
                }`}
              >
                {day.name}
              </span>
              {isToday && (
                <Badge className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-primary/30">
                  Vandaag
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <DayTypePill type={day.type} />
              {day.label !== "Rust" && (
                <span className="text-xs text-muted-foreground">
                  {day.label}
                </span>
              )}
            </div>
          </div>
          <div className="text-muted-foreground">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {expanded && exercises.length > 0 && (
          <CardContent className="px-4 pb-4 pt-0">
            <div className="border-t border-border pt-3 space-y-1.5">
              {exercises.map((ex, i) => (
                <div
                  key={`${ex.id}-${i}`}
                  className="flex items-center gap-3 py-1"
                  data-ocid={`schema.row.${i + 1}`}
                >
                  <span className="w-5 text-center text-xs text-muted-foreground font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-foreground font-medium">
                    {ex.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ex.muscleGroup}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        )}

        {expanded && day.type === "rust" && (
          <CardContent className="px-4 pb-4 pt-0">
            <div className="border-t border-border pt-3 text-center text-sm text-muted-foreground py-2">
              Rustdag – herstel en regeneratie 🌙
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

export function Schema() {
  const todayIndex = getTodayScheduleIndex();
  const [swaps] = useLocalStorage<Record<string, ExerciseOption>>(
    "gymflow_swaps",
    {},
  );
  const [dayTypeOverrides] = useLocalStorage<Record<number, string>>(
    "gymflow_day_types",
    {},
  );
  const [expandedDay, setExpandedDay] = useState<number>(todayIndex);

  const schedule = useMemo(() => {
    return DEFAULT_SCHEDULE.map((day) => {
      const overriddenType = dayTypeOverrides[day.dayIndex];
      return overriddenType
        ? { ...day, type: overriddenType as ScheduleDay["type"] }
        : day;
    });
  }, [dayTypeOverrides]);

  function getExercisesForDay(day: ScheduleDay): ExerciseOption[] {
    return day.exerciseIds.map((id, slotIndex) => {
      const swapKey = `${day.dayIndex}-${slotIndex}`;
      return swaps[swapKey] ?? EXERCISES[id];
    });
  }

  const muscleGroups = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const day of schedule) {
      if (day.type !== "kracht") continue;
      for (const id of day.exerciseIds) {
        const ex = EXERCISES[id];
        if (ex) {
          counts[ex.muscleGroup] = (counts[ex.muscleGroup] ?? 0) + 1;
        }
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [schedule]);

  return (
    <div className="min-h-screen px-4 pt-8">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display text-4xl font-black">Schema</h1>
        <p className="text-muted-foreground mt-1">
          Wekelijks trainingsoverzicht
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-5 p-4 rounded-2xl bg-card border border-border"
        data-ocid="schema.panel"
      >
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
          Spiergroepen verdeling
        </p>
        <div className="flex flex-wrap gap-2">
          {muscleGroups.map(([group, count]) => (
            <span
              key={group}
              className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground font-medium"
            >
              {group} <span className="text-primary font-bold">{count}×</span>
            </span>
          ))}
        </div>
      </motion.div>

      <div className="space-y-3 pb-4" data-ocid="schema.list">
        {schedule.map((day, i) => (
          <DayCard
            key={day.dayIndex}
            day={day}
            isToday={day.dayIndex === todayIndex}
            exercises={getExercisesForDay(day)}
            expanded={expandedDay === day.dayIndex}
            onToggle={() =>
              setExpandedDay((prev) =>
                prev === day.dayIndex ? -1 : day.dayIndex,
              )
            }
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
