import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  ChevronRight,
  Moon,
  RotateCcw,
  Wind,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DEFAULT_SCHEDULE,
  EXERCISES,
  type ExerciseOption,
  type ScheduleDay,
} from "../data/exercises";
import { useLocalStorage } from "../hooks/useLocalStorage";

const DAY_TYPE_LABELS: Record<string, string> = {
  kracht: "Kracht",
  cardio: "Cardio",
  rust: "Rust",
};

function DayTypeIcon({ type }: { type: string }) {
  if (type === "kracht") return <Zap size={14} className="text-primary" />;
  if (type === "cardio") return <Wind size={14} className="text-accent" />;
  return <Moon size={14} className="text-muted-foreground" />;
}

interface ExerciseSlotRowProps {
  dayIndex: number;
  slotIndex: number;
  primaryId: number;
  activeExercise: ExerciseOption;
  onSwap: (
    dayIndex: number,
    slotIndex: number,
    exercise: ExerciseOption,
  ) => void;
}

function ExerciseSlotRow({
  dayIndex,
  slotIndex,
  primaryId,
  activeExercise,
  onSwap,
}: ExerciseSlotRowProps) {
  const [open, setOpen] = useState(false);
  const primaryExercise = EXERCISES[primaryId];
  const alternatives = primaryExercise?.alternatives ?? [];
  const isSwapped = activeExercise.id !== primaryId;

  const allOptions: ExerciseOption[] = [
    primaryExercise ?? activeExercise,
    ...alternatives,
  ].filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <div className="flex items-center gap-2 py-2 border-b border-border/50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {activeExercise.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {activeExercise.equipment}
        </p>
      </div>
      {isSwapped && (
        <Badge className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary border-primary/30 shrink-0">
          Gewijzigd
        </Badge>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 px-2 py-1 rounded-lg hover:bg-secondary"
        data-ocid={`instellingen.edit_button.${slotIndex + 1}`}
      >
        Wissel <ChevronRight size={14} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={() => setOpen(false)}
          onKeyDown={handleKeyDown}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-md bg-card border-t border-border rounded-t-2xl p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
            data-ocid="instellingen.dialog"
          >
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4" />
            <h3 className="font-display font-bold text-lg mb-3">
              Kies oefening
            </h3>
            <div className="space-y-2">
              {allOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => {
                    onSwap(dayIndex, slotIndex, opt);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                    activeExercise.id === opt.id
                      ? "border-primary/60 bg-primary/10"
                      : "border-border hover:border-primary/40 hover:bg-primary/5"
                  }`}
                  data-ocid="instellingen.button"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">
                      {opt.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {opt.equipment} · {opt.muscleGroup}
                    </p>
                  </div>
                  {activeExercise.id === opt.id && (
                    <CheckCircle2 size={16} className="text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-3"
              onClick={() => setOpen(false)}
              data-ocid="instellingen.close_button"
            >
              Sluiten
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export function Instellingen() {
  const [swaps, setSwaps] = useLocalStorage<Record<string, ExerciseOption>>(
    "gymflow_swaps",
    {},
  );
  const [dayTypeOverrides, setDayTypeOverrides] = useLocalStorage<
    Record<number, string>
  >("gymflow_day_types", {});

  const schedule = DEFAULT_SCHEDULE.map((day) => {
    const overriddenType = dayTypeOverrides[day.dayIndex];
    return overriddenType
      ? { ...day, type: overriddenType as ScheduleDay["type"] }
      : day;
  });

  function handleDayTypeChange(dayIndex: number, newType: string) {
    setDayTypeOverrides((prev) => ({ ...prev, [dayIndex]: newType }));
  }

  function handleExerciseSwap(
    dayIndex: number,
    slotIndex: number,
    exercise: ExerciseOption,
  ) {
    const key = `${dayIndex}-${slotIndex}`;
    setSwaps((prev) => ({ ...prev, [key]: exercise }));
  }

  function resetAll() {
    setSwaps({});
    setDayTypeOverrides({});
    toast.success("Schema gereset naar standaardwaarden");
  }

  return (
    <div className="min-h-screen px-4 pt-8 pb-4">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display text-4xl font-black">Instellingen</h1>
        <p className="text-muted-foreground mt-1">Beheer je trainingsschema</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mb-6"
        data-ocid="instellingen.section"
      >
        <h2 className="font-display font-bold text-xl mb-3">Schema beheer</h2>
        <div className="space-y-3">
          {schedule.map((day, i) => (
            <motion.div
              key={day.dayIndex}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + i * 0.04 }}
            >
              <Card
                className="border-border bg-card"
                data-ocid={`instellingen.item.${i + 1}`}
              >
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DayTypeIcon type={day.type} />
                      <CardTitle className="font-display text-base">
                        {day.name}
                      </CardTitle>
                    </div>
                    <Select
                      value={day.type}
                      onValueChange={(v) =>
                        handleDayTypeChange(day.dayIndex, v)
                      }
                    >
                      <SelectTrigger
                        className="w-28 h-8 text-xs bg-secondary border-border"
                        data-ocid={`instellingen.select.${i + 1}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {Object.entries(DAY_TYPE_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val} className="text-sm">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>

                {day.type === "kracht" && day.exerciseIds.length > 0 && (
                  <CardContent className="px-4 pb-3 pt-0">
                    <div className="border-t border-border/60 pt-2">
                      {day.exerciseIds.map((id, slotIndex) => {
                        const swapKey = `${day.dayIndex}-${slotIndex}`;
                        const active = swaps[swapKey] ?? EXERCISES[id];
                        if (!active) return null;
                        return (
                          <ExerciseSlotRow
                            key={`${day.dayIndex}-${slotIndex}`}
                            dayIndex={day.dayIndex}
                            slotIndex={slotIndex}
                            primaryId={id}
                            activeExercise={active}
                            onSwap={handleExerciseSwap}
                          />
                        );
                      })}
                    </div>
                  </CardContent>
                )}

                {day.type === "cardio" && day.exerciseIds.length > 0 && (
                  <CardContent className="px-4 pb-3 pt-0">
                    <div className="border-t border-border/60 pt-2 space-y-1">
                      {day.exerciseIds.map((id) => {
                        const ex = EXERCISES[id];
                        return ex ? (
                          <div
                            key={id}
                            className="flex items-center gap-2 py-1"
                          >
                            <Wind size={14} className="text-accent shrink-0" />
                            <span className="text-sm text-muted-foreground">
                              {ex.name}
                            </span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-12 border-destructive/40 text-destructive hover:bg-destructive/10"
              data-ocid="instellingen.delete_button"
            >
              <RotateCcw size={16} className="mr-2" /> Schema resetten naar
              standaard
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent
            className="bg-card border-border"
            data-ocid="instellingen.dialog"
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display">
                Schema resetten?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                Alle aangepaste dagtypen en oefeningwisselingen worden
                teruggezet naar de standaardinstellingen.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="border-border"
                data-ocid="instellingen.cancel_button"
              >
                Annuleren
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={resetAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-ocid="instellingen.confirm_button"
              >
                Resetten
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>

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
