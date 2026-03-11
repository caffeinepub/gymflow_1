import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Moon,
  Plus,
  Shuffle,
  Trash2,
  Wind,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  DEFAULT_SCHEDULE,
  EXERCISES,
  type ExerciseOption,
  KRACHT_LABELS,
  type ScheduleDay,
  getExerciseIdsByKrachtType,
} from "../data/exercises";
import { useLocalStorage } from "../hooks/useLocalStorage";

type KrachtType = "push" | "pull" | "legs" | "upper" | "lower";

const MUSCLE_GROUP_OPTIONS = [
  "Borst",
  "Schouders",
  "Triceps",
  "Rug",
  "Biceps",
  "Benen/Billen",
  "Billen/Hamstrings",
  "Hamstrings",
  "Quadriceps",
  "Kuiten",
  "Conditie",
  "Schouders/Rug",
  "Overig",
];

function getTodayScheduleIndex(): number {
  return (new Date().getDay() + 6) % 7;
}

function DayTypePill({ type }: { type: string }) {
  if (type === "kracht")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
        <Zap size={9} /> Kracht
      </span>
    );
  if (type === "cardio")
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-semibold">
        <Wind size={9} /> Cardio
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
      <Moon size={9} /> Rust
    </span>
  );
}

interface DragState {
  active: boolean;
  fromIndex: number | null;
}

function useDragReorder(
  items: ExerciseOption[],
  onReorder: (newOrder: ExerciseOption[]) => void,
) {
  const [dragState, setDragState] = useState<DragState>({
    active: false,
    fromIndex: null,
  });
  const [localItems, setLocalItems] = useState<ExerciseOption[]>(items);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragActiveRef = useRef(false);
  const fromIndexRef = useRef<number | null>(null);
  const localItemsRef = useRef<ExerciseOption[]>(items);

  const prevItemsRef = useRef(items);
  if (prevItemsRef.current !== items) {
    prevItemsRef.current = items;
    localItemsRef.current = items;
    setLocalItems(items);
    setDragState({ active: false, fromIndex: null });
  }

  const getIndexFromY = useCallback((clientY: number): number => {
    let closest = 0;
    let closestDist = Number.POSITIVE_INFINITY;
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const dist = Math.abs(clientY - center);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    return closest;
  }, []);

  const handleGripPointerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      e.stopPropagation();
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);
      fromIndexRef.current = index;

      longPressTimer.current = setTimeout(() => {
        dragActiveRef.current = true;
        if (navigator.vibrate) navigator.vibrate(40);
        setDragState({ active: true, fromIndex: index });
      }, 2000);
    },
    [],
  );

  const handleGripPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragActiveRef.current || fromIndexRef.current === null) return;
      e.preventDefault();
      const overIdx = getIndexFromY(e.clientY);
      const currentFrom = fromIndexRef.current;
      if (overIdx !== currentFrom) {
        const newItems = [...localItemsRef.current];
        const [moved] = newItems.splice(currentFrom, 1);
        newItems.splice(overIdx, 0, moved);
        localItemsRef.current = newItems;
        fromIndexRef.current = overIdx;
        setLocalItems(newItems);
        setDragState({ active: true, fromIndex: overIdx });
      }
    },
    [getIndexFromY],
  );

  const handleGripPointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (dragActiveRef.current) {
      dragActiveRef.current = false;
      onReorder(localItemsRef.current);
    }
    fromIndexRef.current = null;
    setDragState({ active: false, fromIndex: null });
  }, [onReorder]);

  const handleGripPointerCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    dragActiveRef.current = false;
    fromIndexRef.current = null;
    setDragState({ active: false, fromIndex: null });
  }, []);

  return {
    localItems,
    dragState,
    itemRefs,
    handleGripPointerDown,
    handleGripPointerMove,
    handleGripPointerUp,
    handleGripPointerCancel,
  };
}

// ── AlternativesDialog ────────────────────────────────────────────────────

interface AlternativesDialogProps {
  open: boolean;
  onClose: () => void;
  exercise: ExerciseOption;
  onSelect: (newExercise: ExerciseOption) => void;
  customExercises: ExerciseOption[];
}

function AlternativesDialog({
  open,
  onClose,
  exercise,
  onSelect,
  customExercises,
}: AlternativesDialogProps) {
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState(exercise.muscleGroup);

  const prevOpen = useRef(false);
  if (prevOpen.current !== open) {
    prevOpen.current = open;
    if (open) {
      setNewName("");
      setNewMuscle(exercise.muscleGroup);
    }
  }

  const builtInAlts: ExerciseOption[] =
    exercise.id in EXERCISES
      ? EXERCISES[exercise.id as keyof typeof EXERCISES].alternatives
      : [];

  function handleSelectAlt(alt: ExerciseOption) {
    onSelect(alt);
    onClose();
  }

  function handleAddManual() {
    if (!newName.trim()) return;
    const newEx: ExerciseOption = {
      id: 9000 + (Date.now() % 100000),
      name: newName.trim(),
      equipment: "Eigen",
      muscleGroup: newMuscle || "Overig",
    };
    onSelect(newEx);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-card border-border max-w-sm mx-auto max-h-[80vh] overflow-y-auto"
        data-ocid="schema.alternatives.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-base">
            Alternatief kiezen
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-1">
          {/* Current exercise */}
          <div className="px-3 py-2 rounded-lg bg-secondary/50 border border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
              Huidige oefening
            </p>
            <p className="text-sm font-semibold text-foreground">
              {exercise.name}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {exercise.muscleGroup}
            </p>
          </div>

          {/* Built-in alternatives */}
          {builtInAlts.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                Alternatieven
              </p>
              <div className="space-y-1">
                {builtInAlts.map((alt) => (
                  <button
                    key={alt.id}
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary/60 hover:border-primary/40 transition-all text-left"
                    onClick={() => handleSelectAlt(alt)}
                    data-ocid="schema.alternatives.button"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {alt.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {alt.muscleGroup} · {alt.equipment}
                      </p>
                    </div>
                    <Shuffle
                      size={12}
                      className="text-muted-foreground shrink-0"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom exercises */}
          {customExercises.length > 0 && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                Eigen oefeningen
              </p>
              <div className="space-y-1">
                {customExercises.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card hover:bg-secondary/60 hover:border-accent/40 transition-all text-left"
                    onClick={() => handleSelectAlt(ex)}
                    data-ocid="schema.alternatives.button"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {ex.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {ex.muscleGroup}
                      </p>
                    </div>
                    <Badge className="text-[9px] px-1 py-0 bg-accent/20 text-accent border-accent/30 shrink-0">
                      Eigen
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual entry */}
          <div className="pt-1 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
              Zelf invoeren
            </p>
            <div className="space-y-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Naam oefening"
                className="bg-background border-border text-sm h-8"
                data-ocid="schema.alternatives.input"
                onKeyDown={(e) => e.key === "Enter" && handleAddManual()}
              />
              <Select value={newMuscle} onValueChange={setNewMuscle}>
                <SelectTrigger
                  className="bg-background border-border text-sm h-8"
                  data-ocid="schema.alternatives.select"
                >
                  <SelectValue placeholder="Spiergroep" />
                </SelectTrigger>
                <SelectContent>
                  {MUSCLE_GROUP_OPTIONS.map((mg) => (
                    <SelectItem key={mg} value={mg}>
                      {mg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="w-full h-8 text-xs"
                onClick={handleAddManual}
                disabled={!newName.trim()}
                data-ocid="schema.alternatives.confirm_button"
              >
                <Plus size={12} className="mr-1" /> Toevoegen als alternatief
              </Button>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={onClose}
            data-ocid="schema.alternatives.cancel_button"
          >
            Annuleren
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── EditDayExercisesDialog ─────────────────────────────────────────────────

interface EditDayExercisesDialogProps {
  open: boolean;
  onClose: () => void;
  dayIndex: number;
  dayName: string;
  exercises: ExerciseOption[];
  customExercises: ExerciseOption[];
  onSave: (
    dayIndex: number,
    mainExercises: ExerciseOption[],
    extraExercises: ExerciseOption[],
  ) => void;
}

function EditDayExercisesDialog({
  open,
  onClose,
  dayIndex,
  dayName,
  exercises,
  customExercises,
  onSave,
}: EditDayExercisesDialogProps) {
  const [localExercises, setLocalExercises] = useState<ExerciseOption[]>([]);
  const [altForIndex, setAltForIndex] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newMuscle, setNewMuscle] = useState("Overig");

  const prevOpen = useRef(false);
  if (prevOpen.current !== open) {
    prevOpen.current = open;
    if (open) {
      setLocalExercises([...exercises]);
      setAltForIndex(null);
      setNewName("");
      setNewMuscle("Overig");
    }
  }

  const dragReorder = useDragReorder(localExercises, (newOrder) => {
    setLocalExercises(newOrder);
  });

  function handleDeleteExercise(index: number) {
    setLocalExercises((prev) => prev.filter((_, i) => i !== index));
  }

  function handleReplaceExercise(index: number, newEx: ExerciseOption) {
    setLocalExercises((prev) =>
      prev.map((ex, i) => (i === index ? newEx : ex)),
    );
  }

  function handleAddExercise() {
    if (!newName.trim()) return;
    const newEx: ExerciseOption = {
      id: 9000 + (Date.now() % 100000),
      name: newName.trim(),
      equipment: "Eigen",
      muscleGroup: newMuscle || "Overig",
    };
    setLocalExercises((prev) => [...prev, newEx]);
    setNewName("");
    setNewMuscle("Overig");
  }

  function handleSave() {
    const mainExercises = localExercises.filter((e) => e.id < 9000);
    const extraExercises = localExercises.filter((e) => e.id >= 9000);
    onSave(dayIndex, mainExercises, extraExercises);
    onClose();
  }

  const exerciseForAlt =
    altForIndex !== null ? dragReorder.localItems[altForIndex] : null;

  return (
    <>
      <Dialog
        open={open && altForIndex === null}
        onOpenChange={(o) => !o && onClose()}
      >
        <DialogContent
          className="bg-card border-border max-w-sm mx-auto max-h-[80vh] overflow-y-auto"
          data-ocid="schema.edit_exercises.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display font-bold">
              Oefeningen aanpassen
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{dayName}</p>
          </DialogHeader>

          <div className="space-y-3 mt-1">
            {/* Exercise list */}
            <div className="space-y-0.5">
              {!dragReorder.dragState.active &&
                dragReorder.localItems.length > 0 && (
                  <p className="text-[10px] text-muted-foreground text-center mb-1.5 opacity-60">
                    Houd het ⠿ icoon 2 sec. vast om te herschikken
                  </p>
                )}
              {dragReorder.dragState.active && (
                <p className="text-[10px] text-primary text-center mb-1.5 animate-pulse font-medium">
                  Versleep naar gewenste positie ↕
                </p>
              )}

              <AnimatePresence>
                {dragReorder.localItems.map((ex, i) => {
                  const isCustom = ex.id >= 9000;
                  const isDragging =
                    dragReorder.dragState.active &&
                    dragReorder.dragState.fromIndex === i;

                  return (
                    <motion.div
                      key={`${ex.id}-${i}`}
                      layout
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div
                        ref={(el) => {
                          dragReorder.itemRefs.current[i] = el;
                        }}
                        className={`flex items-center gap-1.5 py-1.5 px-1 rounded-md transition-all duration-100 ${
                          isDragging
                            ? "bg-primary/10 scale-[1.01] ring-1 ring-primary/40"
                            : "hover:bg-secondary/30"
                        }`}
                        data-ocid={`schema.edit_exercises.row.${i + 1}`}
                      >
                        {/* Drag handle */}
                        <div
                          className="p-1 rounded cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors touch-none select-none shrink-0"
                          onPointerDown={(e) =>
                            dragReorder.handleGripPointerDown(e, i)
                          }
                          onPointerMove={dragReorder.handleGripPointerMove}
                          onPointerUp={dragReorder.handleGripPointerUp}
                          onPointerCancel={dragReorder.handleGripPointerCancel}
                          data-ocid={`schema.edit_exercises.drag_handle.${i + 1}`}
                        >
                          <GripVertical size={13} />
                        </div>

                        {/* Number */}
                        <span className="w-4 text-center text-[10px] text-muted-foreground font-bold shrink-0">
                          {i + 1}
                        </span>

                        {/* Name & muscle */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {ex.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {ex.muscleGroup}
                          </p>
                        </div>

                        {isCustom && (
                          <Badge className="text-[9px] px-1 py-0 bg-accent/20 text-accent border-accent/30 shrink-0">
                            Eigen
                          </Badge>
                        )}

                        {/* Replace button */}
                        <button
                          type="button"
                          className="p-1 rounded text-muted-foreground hover:text-primary transition-colors shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAltForIndex(i);
                          }}
                          title="Vervang oefening"
                          data-ocid={`schema.edit_exercises.edit_button.${i + 1}`}
                        >
                          <Shuffle size={12} />
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteExercise(i);
                          }}
                          title={`Verwijder ${ex.name}`}
                          data-ocid={`schema.edit_exercises.delete_button.${i + 1}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {dragReorder.localItems.length === 0 && (
                <p
                  className="text-sm text-muted-foreground text-center py-3"
                  data-ocid="schema.edit_exercises.empty_state"
                >
                  Geen oefeningen — voeg er een toe hieronder
                </p>
              )}
            </div>

            {/* Add new exercise inline */}
            <div className="pt-2 border-t border-border/50 space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Oefening toevoegen
              </p>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Naam oefening"
                className="bg-background border-border text-sm h-8"
                data-ocid="schema.edit_exercises.input"
                onKeyDown={(e) => e.key === "Enter" && handleAddExercise()}
              />
              <Select value={newMuscle} onValueChange={setNewMuscle}>
                <SelectTrigger
                  className="bg-background border-border text-sm h-8"
                  data-ocid="schema.edit_exercises.select"
                >
                  <SelectValue placeholder="Spiergroep" />
                </SelectTrigger>
                <SelectContent>
                  {MUSCLE_GROUP_OPTIONS.map((mg) => (
                    <SelectItem key={mg} value={mg}>
                      {mg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs border-dashed"
                onClick={handleAddExercise}
                disabled={!newName.trim()}
                data-ocid="schema.edit_exercises.primary_button"
              >
                <Plus size={12} className="mr-1" /> Oefening toevoegen
              </Button>
            </div>

            {/* Save / Cancel */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
                data-ocid="schema.edit_exercises.cancel_button"
              >
                Annuleren
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                data-ocid="schema.edit_exercises.save_button"
              >
                Opslaan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AlternativesDialog sub-dialog */}
      {exerciseForAlt !== null && exerciseForAlt !== undefined && (
        <AlternativesDialog
          open={altForIndex !== null}
          onClose={() => setAltForIndex(null)}
          exercise={exerciseForAlt}
          customExercises={customExercises}
          onSelect={(newEx) => {
            if (altForIndex !== null) {
              handleReplaceExercise(altForIndex, newEx);
            }
            setAltForIndex(null);
          }}
        />
      )}
    </>
  );
}

// ── DayCard ───────────────────────────────────────────────────────────────

interface DayCardProps {
  day: ScheduleDay;
  isToday: boolean;
  exercises: ExerciseOption[];
  extraExercises: ExerciseOption[];
  expanded: boolean;
  onToggle: () => void;
  index: number;
  onReorder: (dayIndex: number, newList: ExerciseOption[]) => void;
  onAddExercise: (dayIndex: number) => void;
  onDeleteExercise: (dayIndex: number, exerciseId: number) => void;
  onEditExercises: (dayIndex: number) => void;
}

function DayCard({
  day,
  isToday,
  exercises,
  extraExercises,
  expanded,
  onToggle,
  index,
  onReorder,
  onAddExercise,
  onDeleteExercise,
  onEditExercises,
}: DayCardProps) {
  const allExercises = useMemo(
    () => [...exercises, ...extraExercises],
    [exercises, extraExercises],
  );

  const handleReorder = useCallback(
    (newList: ExerciseOption[]) => {
      onReorder(day.dayIndex, newList);
    },
    [day.dayIndex, onReorder],
  );

  const {
    localItems,
    dragState,
    itemRefs,
    handleGripPointerDown,
    handleGripPointerMove,
    handleGripPointerUp,
    handleGripPointerCancel,
  } = useDragReorder(allExercises, handleReorder);

  let customExerciseCounter = 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
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
          className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 min-h-[48px]"
          onClick={onToggle}
          data-ocid={`schema.toggle.${index + 1}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-display font-black text-xs ${
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
                className={`font-display font-bold text-sm ${
                  isToday ? "text-primary" : "text-foreground"
                }`}
              >
                {day.name}
              </span>
              {isToday && (
                <Badge className="text-[9px] px-1 py-0 bg-primary/20 text-primary border-primary/30">
                  Vandaag
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <DayTypePill type={day.type} />
              {day.label !== "Rust" && (
                <span className="text-[11px] text-muted-foreground">
                  {day.label}
                </span>
              )}
            </div>
          </div>
          <div className="text-muted-foreground">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {expanded && day.type !== "rust" && (
          <CardContent className="px-3 pb-3 pt-0">
            <div className="border-t border-border pt-2 space-y-0.5">
              {day.type === "kracht" && !dragState.active && (
                <p className="text-[10px] text-muted-foreground text-center mb-1.5 opacity-60">
                  Houd het ⠿ icoon 2 sec. vast om te herschikken
                </p>
              )}
              {dragState.active && (
                <p className="text-[10px] text-primary text-center mb-1.5 animate-pulse font-medium">
                  Versleep naar gewenste positie ↕
                </p>
              )}

              {localItems.map((ex, i) => {
                const isCustom = ex.id >= 9000;
                if (isCustom) customExerciseCounter += 1;
                const deleteOcid = `schema.delete_button.${customExerciseCounter}`;

                return (
                  <div
                    key={`${ex.id}-${i}`}
                    ref={(el) => {
                      itemRefs.current[i] = el;
                    }}
                    className={`flex items-center gap-2 py-1 px-1 rounded-md transition-all duration-100 ${
                      dragState.active && dragState.fromIndex === i
                        ? "bg-primary/10 scale-[1.01] ring-1 ring-primary/40"
                        : ""
                    }`}
                    data-ocid={`schema.row.${i + 1}`}
                  >
                    {day.type === "kracht" && (
                      <div
                        className="p-1 rounded cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors touch-none select-none shrink-0"
                        onPointerDown={(e) => handleGripPointerDown(e, i)}
                        onPointerMove={handleGripPointerMove}
                        onPointerUp={handleGripPointerUp}
                        onPointerCancel={handleGripPointerCancel}
                        data-ocid={`schema.drag_handle.${i + 1}`}
                      >
                        <GripVertical size={13} />
                      </div>
                    )}
                    <span className="w-4 text-center text-[10px] text-muted-foreground font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-foreground font-medium truncate">
                      {ex.name}
                    </span>
                    {isCustom && (
                      <Badge className="text-[9px] px-1 py-0 bg-accent/20 text-accent border-accent/30 shrink-0">
                        Eigen
                      </Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {ex.muscleGroup}
                    </span>
                    {isCustom && (
                      <button
                        type="button"
                        className="p-0.5 rounded text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteExercise(day.dayIndex, ex.id);
                        }}
                        data-ocid={deleteOcid}
                        aria-label={`Verwijder ${ex.name}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}

              {localItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Geen oefeningen gepland
                </p>
              )}

              {day.type === "kracht" && (
                <div className="pt-1.5">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                    onClick={() => onAddExercise(day.dayIndex)}
                    data-ocid={`schema.add_button.${index + 1}`}
                  >
                    <Plus size={12} /> Oefening toevoegen
                  </button>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-primary/30 text-xs text-primary/70 hover:text-primary hover:border-primary/60 hover:bg-primary/5 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditExercises(day.dayIndex);
                  }}
                  data-ocid={`schema.edit_button.${index + 1}`}
                >
                  <CalendarDays size={12} /> Wijzigen dagschema
                </button>
              </div>
            </div>
          </CardContent>
        )}

        {expanded && day.type === "rust" && (
          <CardContent className="px-3 pb-3 pt-0">
            <div className="border-t border-border pt-2">
              <div className="text-center text-xs text-muted-foreground py-2">
                Rustdag – herstel en regeneratie 🌙
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

// ── AddExerciseDialog ─────────────────────────────────────────────────────

interface AddExerciseDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (exercise: ExerciseOption) => void;
}

function AddExerciseDialog({ open, onClose, onAdd }: AddExerciseDialogProps) {
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");

  function handleAdd() {
    if (!name.trim()) return;
    const newEx: ExerciseOption = {
      id: 9000 + (Date.now() % 100000),
      name: name.trim(),
      equipment: "Eigen",
      muscleGroup: muscleGroup.trim() || "Overig",
    };
    onAdd(newEx);
    setName("");
    setMuscleGroup("");
  }

  function handleClose() {
    setName("");
    setMuscleGroup("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="bg-card border-border max-w-sm mx-auto"
        data-ocid="schema.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display font-bold">
            Oefening toevoegen
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Naam oefening</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bijv. Facepull"
              className="bg-background border-border"
              data-ocid="schema.input"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Spiergroep</Label>
            <Input
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              placeholder="bijv. Rug, Schouders, Biceps…"
              className="bg-background border-border"
              data-ocid="schema.input"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              data-ocid="schema.cancel_button"
            >
              Annuleren
            </Button>
            <Button
              className="flex-1"
              onClick={handleAdd}
              disabled={!name.trim()}
              data-ocid="schema.confirm_button"
            >
              Toevoegen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Schema page ───────────────────────────────────────────────────────────

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
  const [krachtTypeOverrides] = useLocalStorage<Record<number, KrachtType>>(
    "gymflow_kracht_types",
    {},
  );
  const [dayExerciseOrders, setDayExerciseOrders] = useLocalStorage<
    Record<number, ExerciseOption[]>
  >("gymflow_day_exercise_orders", {});
  const [extraExercises, setExtraExercises] = useLocalStorage<
    Record<number, ExerciseOption[]>
  >("gymflow_extra_exercises", {});

  const [expandedDay, setExpandedDay] = useState<number>(todayIndex);
  const [addDialogDayIndex, setAddDialogDayIndex] = useState<number | null>(
    null,
  );
  const [editExercisesDayIndex, setEditExercisesDayIndex] = useState<
    number | null
  >(null);

  const schedule = useMemo(() => {
    return DEFAULT_SCHEDULE.map((day) => {
      const overriddenType = dayTypeOverrides[day.dayIndex];
      const resolvedType = overriddenType ?? day.type;

      if (resolvedType === "kracht") {
        const krachtType = krachtTypeOverrides[day.dayIndex];
        if (krachtType) {
          return {
            ...day,
            type: "kracht" as ScheduleDay["type"],
            label: KRACHT_LABELS[krachtType] ?? day.label,
            exerciseIds: getExerciseIdsByKrachtType(krachtType),
          };
        }
      }

      return overriddenType
        ? { ...day, type: overriddenType as ScheduleDay["type"] }
        : day;
    });
  }, [dayTypeOverrides, krachtTypeOverrides]);

  function getMainExercisesForDay(day: ScheduleDay): ExerciseOption[] {
    const stored = dayExerciseOrders[day.dayIndex];
    if (stored && stored.length > 0) {
      return stored;
    }
    return day.exerciseIds.map((id, slotIndex) => {
      const swapKey = `${day.dayIndex}-${slotIndex}`;
      return swaps[swapKey] ?? EXERCISES[id];
    });
  }

  function handleReorder(dayIndex: number, newList: ExerciseOption[]) {
    const extra = extraExercises[dayIndex] ?? [];
    const extraIds = new Set(extra.map((e) => e.id));
    const mainList = newList.filter((e) => !extraIds.has(e.id));
    const reorderedExtra = newList.filter((e) => extraIds.has(e.id));

    setDayExerciseOrders((prev) => ({ ...prev, [dayIndex]: mainList }));
    if (JSON.stringify(reorderedExtra) !== JSON.stringify(extra)) {
      setExtraExercises((prev) => ({ ...prev, [dayIndex]: reorderedExtra }));
    }
  }

  function handleDeleteExercise(dayIndex: number, exerciseId: number) {
    setExtraExercises((prev) => ({
      ...prev,
      [dayIndex]: (prev[dayIndex] ?? []).filter((e) => e.id !== exerciseId),
    }));
    setDayExerciseOrders((prev) => {
      const existing = prev[dayIndex];
      if (!existing) return prev;
      return {
        ...prev,
        [dayIndex]: existing.filter((e) => e.id !== exerciseId),
      };
    });
  }

  function handleConfirmAdd(exercise: ExerciseOption) {
    if (addDialogDayIndex === null) return;
    setExtraExercises((prev) => ({
      ...prev,
      [addDialogDayIndex]: [...(prev[addDialogDayIndex] ?? []), exercise],
    }));
    setAddDialogDayIndex(null);
  }

  function handleSaveEditedExercises(
    dayIndex: number,
    mainExercises: ExerciseOption[],
    extra: ExerciseOption[],
  ) {
    setDayExerciseOrders((prev) => ({ ...prev, [dayIndex]: mainExercises }));
    setExtraExercises((prev) => ({ ...prev, [dayIndex]: extra }));
  }

  const muscleGroups = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const day of schedule) {
      if (day.type !== "kracht") continue;
      const stored = dayExerciseOrders[day.dayIndex];
      const main: ExerciseOption[] =
        stored && stored.length > 0
          ? stored
          : day.exerciseIds.map((id, slotIndex) => {
              const swapKey = `${day.dayIndex}-${slotIndex}`;
              return swaps[swapKey] ?? EXERCISES[id];
            });
      const extra = extraExercises[day.dayIndex] ?? [];
      for (const ex of [...main, ...extra]) {
        if (ex) counts[ex.muscleGroup] = (counts[ex.muscleGroup] ?? 0) + 1;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [schedule, dayExerciseOrders, swaps, extraExercises]);

  const editDay =
    editExercisesDayIndex !== null
      ? schedule.find((d) => d.dayIndex === editExercisesDayIndex)
      : null;

  const allCustomExercises = useMemo(() => {
    const seen = new Set<number>();
    const result: ExerciseOption[] = [];
    for (const list of Object.values(extraExercises)) {
      for (const ex of list) {
        if (!seen.has(ex.id)) {
          seen.add(ex.id);
          result.push(ex);
        }
      }
    }
    return result;
  }, [extraExercises]);

  return (
    <div className="min-h-screen px-4 pt-6 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <h1 className="font-display text-3xl font-black">Schema</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Wekelijks trainingsoverzicht
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="mb-4 px-3 py-2.5 rounded-xl bg-card border border-border"
        data-ocid="schema.panel"
      >
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
          Spiergroepen verdeling
        </p>
        <div className="flex flex-wrap gap-1.5">
          {muscleGroups.map(([group, count]) => (
            <span
              key={group}
              className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium"
            >
              {group} <span className="text-primary font-bold">{count}×</span>
            </span>
          ))}
        </div>
      </motion.div>

      <div className="space-y-2 pb-4" data-ocid="schema.list">
        {schedule.map((day, i) => (
          <DayCard
            key={day.dayIndex}
            day={day}
            isToday={day.dayIndex === todayIndex}
            exercises={getMainExercisesForDay(day)}
            extraExercises={extraExercises[day.dayIndex] ?? []}
            expanded={expandedDay === day.dayIndex}
            onToggle={() =>
              setExpandedDay((prev) =>
                prev === day.dayIndex ? -1 : day.dayIndex,
              )
            }
            index={i}
            onReorder={handleReorder}
            onAddExercise={(dayIndex) => setAddDialogDayIndex(dayIndex)}
            onDeleteExercise={handleDeleteExercise}
            onEditExercises={(dayIndex) => setEditExercisesDayIndex(dayIndex)}
          />
        ))}
      </div>

      <AddExerciseDialog
        open={addDialogDayIndex !== null}
        onClose={() => setAddDialogDayIndex(null)}
        onAdd={handleConfirmAdd}
      />

      {editDay && (
        <EditDayExercisesDialog
          open={editExercisesDayIndex !== null}
          onClose={() => setEditExercisesDayIndex(null)}
          dayIndex={editDay.dayIndex}
          dayName={`${editDay.name} — ${editDay.label}`}
          exercises={[
            ...getMainExercisesForDay(editDay),
            ...(extraExercises[editDay.dayIndex] ?? []),
          ]}
          customExercises={allCustomExercises}
          onSave={handleSaveEditedExercises}
        />
      )}
    </div>
  );
}
