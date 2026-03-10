import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Plus,
  Shuffle,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { ExerciseLog, WorkoutSession, WorkoutSet } from "../backend";
import { useWorkoutContext } from "../contexts/WorkoutContext";
import { EXERCISES, type ExerciseOption } from "../data/exercises";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useLogWorkout } from "../hooks/useQueries";

let _setIdCounter = 0;
function newSetId() {
  return ++_setIdCounter;
}

interface SetEntry {
  id: number;
  weight: string;
  reps: string;
}

interface WorkoutState {
  sets: Record<number, SetEntry[]>;
  activeExercises: ExerciseOption[];
}

function getPrevSessionData(
  logs: WorkoutSession[],
  exerciseId: number,
): WorkoutSet[] | null {
  for (let i = logs.length - 1; i >= 0; i--) {
    const session = logs[i];
    const found = session.exercises.find(
      (e) => Number(e.exerciseId) === exerciseId,
    );
    if (found && found.sets.length > 0) return found.sets;
  }
  return null;
}

export function ActiveWorkout() {
  const navigate = useNavigate();
  const { activeWorkout, clearWorkout } = useWorkoutContext();

  const [localLogs, setLocalLogs] = useLocalStorage<WorkoutSession[]>(
    "gymflow_logs",
    [],
  );
  const logMutation = useLogWorkout();

  const exercises = activeWorkout?.exercises ?? [];
  const dayName = activeWorkout?.dayName ?? "Training";
  const dayLabel = activeWorkout?.dayLabel ?? "";
  const dayType = activeWorkout?.dayType ?? "kracht";

  const [currentIdx, setCurrentIdx] = useState(0);
  const [workoutState, setWorkoutState] = useState<WorkoutState>(() => ({
    sets: Object.fromEntries(
      exercises.map((_, i) => [i, [{ id: newSetId(), weight: "", reps: "" }]]),
    ),
    activeExercises: [...exercises],
  }));
  const [showAltDialog, setShowAltDialog] = useState(false);
  const [done, setDone] = useState(false);
  const [manualName, setManualName] = useState("");

  const currentExercise = workoutState.activeExercises[currentIdx];
  const currentSets = workoutState.sets[currentIdx] ?? [];

  const alternatives = useMemo(() => {
    const original = exercises[currentIdx];
    if (!original) return [];
    const ex = EXERCISES[original.id];
    return ex?.alternatives ?? [];
  }, [exercises, currentIdx]);

  const prevSets = useMemo(() => {
    if (!currentExercise) return null;
    return getPrevSessionData(localLogs, currentExercise.id);
  }, [localLogs, currentExercise]);

  const updateSet = useCallback(
    (setIdx: number, field: "weight" | "reps", value: string) => {
      setWorkoutState((prev) => {
        const sets = [...(prev.sets[currentIdx] ?? [])];
        sets[setIdx] = { ...sets[setIdx], [field]: value };
        return { ...prev, sets: { ...prev.sets, [currentIdx]: sets } };
      });
    },
    [currentIdx],
  );

  const addSet = useCallback(() => {
    setWorkoutState((prev) => {
      const sets = [...(prev.sets[currentIdx] ?? [])];
      sets.push({ id: newSetId(), weight: "", reps: "" });
      return { ...prev, sets: { ...prev.sets, [currentIdx]: sets } };
    });
  }, [currentIdx]);

  const removeSet = useCallback(
    (setIdx: number) => {
      setWorkoutState((prev) => {
        const sets = (prev.sets[currentIdx] ?? []).filter(
          (_, i) => i !== setIdx,
        );
        return {
          ...prev,
          sets: {
            ...prev.sets,
            [currentIdx]: sets.length
              ? sets
              : [{ id: newSetId(), weight: "", reps: "" }],
          },
        };
      });
    },
    [currentIdx],
  );

  const swapExercise = useCallback(
    (alt: ExerciseOption) => {
      setWorkoutState((prev) => {
        const activeExercises = [...prev.activeExercises];
        activeExercises[currentIdx] = alt;
        return { ...prev, activeExercises };
      });
      setShowAltDialog(false);
    },
    [currentIdx],
  );

  const addManualExercise = useCallback(() => {
    const trimmed = manualName.trim();
    if (!trimmed) return;
    swapExercise({
      id: 9999,
      name: trimmed,
      equipment: "Handmatig",
      muscleGroup: "Handmatig",
    });
    setManualName("");
  }, [manualName, swapExercise]);

  async function finishWorkout() {
    const today = new Date().toISOString().split("T")[0];

    const exerciseLogs: ExerciseLog[] = workoutState.activeExercises.map(
      (ex, i) => {
        const sets: WorkoutSet[] = (workoutState.sets[i] ?? [])
          .filter((s) => s.weight !== "" && s.reps !== "")
          .map((s) => ({
            weight: Number.parseFloat(s.weight) || 0,
            reps: BigInt(Number.parseInt(s.reps) || 0),
          }));
        return {
          exerciseId: BigInt(ex.id),
          exerciseName: ex.name,
          sets,
        };
      },
    );

    const session: WorkoutSession = {
      date: today,
      exercises: exerciseLogs,
      dayType: dayType as WorkoutSession["dayType"],
    };

    setLocalLogs((prev) => [...prev, session]);

    try {
      await logMutation.mutateAsync(session);
      toast.success("Training opgeslagen! 💪");
    } catch {
      toast.error("Opslaan mislukt, maar lokaal bewaard.");
    }
    clearWorkout();
    setDone(true);
  }

  if (!activeWorkout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Button onClick={() => navigate({ to: "/" })} variant="outline">
          Terug naar vandaag
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="font-display text-3xl font-black mb-2">
            Training Klaar!
          </h1>
          <p className="text-muted-foreground mb-8">
            Geweldig werk vandaag. Lekker bezig!
          </p>
          <Button
            size="lg"
            className="w-full h-14 font-display text-lg font-bold"
            onClick={() => navigate({ to: "/" })}
            data-ocid="workout.primary_button"
          >
            Terug naar home
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-6 pb-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/" })}
          className="shrink-0"
          data-ocid="workout.cancel_button"
        >
          <ArrowLeft size={22} />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {dayName} · {dayLabel}
          </p>
          <h2 className="font-display font-bold text-xl truncate">
            Actieve Training
          </h2>
        </div>
        <span className="text-sm font-semibold text-muted-foreground shrink-0">
          {currentIdx + 1}/{exercises.length}
        </span>
      </div>

      <div className="h-1 bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{
            width: `${((currentIdx + 1) / exercises.length) * 100}%`,
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="exercise-card-active rounded-2xl border bg-card p-4 mb-4"
              data-ocid="workout.card"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                    Oefening {currentIdx + 1} van {exercises.length}
                  </p>
                  <h3 className="font-display text-2xl font-black text-foreground leading-tight">
                    {currentExercise?.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {currentExercise?.equipment}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {currentExercise?.muscleGroup}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAltDialog(true)}
                  className="shrink-0 text-xs border-primary/40 text-primary hover:bg-primary/10"
                  data-ocid="workout.secondary_button"
                >
                  <Shuffle size={14} className="mr-1" />
                  Alternatief
                </Button>
              </div>

              {prevSets && prevSets.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">
                    Vorige sessie:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {prevSets.slice(0, 4).map((s, i) => (
                      <span
                        key={`prev-${i}-${s.weight}`}
                        className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground"
                      >
                        {s.weight}kg × {String(s.reps)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-4">
              {currentSets.map((set, setIdx) => (
                <motion.div
                  key={set.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: setIdx * 0.05 }}
                  className="flex items-center gap-2"
                  data-ocid={`workout.row.${setIdx + 1}`}
                >
                  <span className="w-7 text-center text-sm font-bold text-muted-foreground shrink-0">
                    {setIdx + 1}
                  </span>
                  <div className="flex-1 flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="kg"
                        value={set.weight}
                        onChange={(e) =>
                          updateSet(setIdx, "weight", e.target.value)
                        }
                        className="h-12 text-center text-base font-bold bg-card border-border pr-8"
                        data-ocid={`workout.input.${setIdx + 1}`}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                        kg
                      </span>
                    </div>
                    <div className="flex-1 relative">
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="reps"
                        value={set.reps}
                        onChange={(e) =>
                          updateSet(setIdx, "reps", e.target.value)
                        }
                        className="h-12 text-center text-base font-bold bg-card border-border pr-10"
                        data-ocid={`workout.textarea.${setIdx + 1}`}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                        reps
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSet(setIdx)}
                    className="shrink-0 text-muted-foreground hover:text-destructive h-12 w-12"
                    data-ocid={`workout.delete_button.${setIdx + 1}`}
                  >
                    <Trash2 size={16} />
                  </Button>
                </motion.div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full h-11 border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
              onClick={addSet}
              data-ocid="workout.secondary_button"
            >
              <Plus size={16} className="mr-2" /> Set toevoegen
            </Button>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-4 pb-8 pt-3 border-t border-border space-y-3">
        {currentIdx < exercises.length - 1 ? (
          <Button
            size="lg"
            className="w-full h-14 font-display text-lg font-bold"
            onClick={() => setCurrentIdx((i) => i + 1)}
            data-ocid="workout.primary_button"
          >
            Volgende oefening <ArrowRight size={20} className="ml-2" />
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full h-14 font-display text-lg font-bold glow-primary"
            onClick={finishWorkout}
            disabled={logMutation.isPending}
            data-ocid="workout.submit_button"
          >
            {logMutation.isPending ? (
              <Loader2 size={20} className="mr-2 animate-spin" />
            ) : (
              <CheckCircle2 size={20} className="mr-2" />
            )}
            Training afronden
          </Button>
        )}
        {currentIdx > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => setCurrentIdx((i) => i - 1)}
            data-ocid="workout.secondary_button"
          >
            <ArrowLeft size={16} className="mr-1" /> Vorige oefening
          </Button>
        )}
      </div>

      <Dialog
        open={showAltDialog}
        onOpenChange={(open) => {
          setShowAltDialog(open);
          if (!open) setManualName("");
        }}
      >
        <DialogContent
          className="bg-card border-border"
          data-ocid="workout.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Kies alternatief</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                const orig = exercises[currentIdx];
                if (orig) swapExercise(orig);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
              data-ocid="workout.button"
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">
                  {exercises[currentIdx]?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {exercises[currentIdx]?.equipment} · Origineel
                </p>
              </div>
            </button>
            {alternatives.map((alt, i) => (
              <button
                type="button"
                key={alt.id}
                onClick={() => swapExercise(alt)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left"
                data-ocid={`workout.button.${i + 1}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{alt.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {alt.equipment} · {alt.muscleGroup}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">
                  Alt
                </Badge>
              </button>
            ))}

            {/* Manual input section */}
            <div className="pt-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground px-2">
                  Of handmatig invoeren
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Naam oefening..."
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addManualExercise();
                  }}
                  className="flex-1 bg-background border-border"
                  data-ocid="workout.input"
                />
                <Button
                  onClick={addManualExercise}
                  disabled={!manualName.trim()}
                  className="shrink-0"
                  data-ocid="workout.save_button"
                >
                  Toevoegen
                </Button>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowAltDialog(false);
              setManualName("");
            }}
            className="mt-1"
            data-ocid="workout.close_button"
          >
            Annuleren
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
