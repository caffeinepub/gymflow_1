import { Card } from "@/components/ui/card";
import { Moon, Wind, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { DEFAULT_SCHEDULE } from "../data/exercises";
import { useLocalStorage } from "../hooks/useLocalStorage";

type DayType = "kracht" | "cardio" | "rust";
type KrachtType = "push" | "pull" | "legs" | "upper" | "lower";

const DAY_OPTIONS: {
  value: DayType;
  label: string;
  Icon: React.ElementType;
  activeClass: string;
}[] = [
  {
    value: "kracht",
    label: "Kracht",
    Icon: Zap,
    activeClass: "bg-primary text-primary-foreground border-primary",
  },
  {
    value: "cardio",
    label: "Cardio",
    Icon: Wind,
    activeClass: "bg-accent text-accent-foreground border-accent",
  },
  {
    value: "rust",
    label: "Rust",
    Icon: Moon,
    activeClass: "bg-secondary text-foreground border-secondary",
  },
];

const KRACHT_OPTIONS: { value: KrachtType; label: string }[] = [
  { value: "push", label: "Push" },
  { value: "pull", label: "Pull" },
  { value: "legs", label: "Legs" },
  { value: "upper", label: "Upper" },
  { value: "lower", label: "Lower" },
];

function getTodayScheduleIndex(): number {
  return (new Date().getDay() + 6) % 7;
}

export function Werkschema() {
  const todayIndex = getTodayScheduleIndex();
  const [dayTypeOverrides, setDayTypeOverrides] = useLocalStorage<
    Record<number, string>
  >("gymflow_day_types", {});
  const [krachtTypeOverrides, setKrachtTypeOverrides] = useLocalStorage<
    Record<number, KrachtType>
  >("gymflow_kracht_types", {});

  function handleTypeChange(dayIndex: number, type: DayType) {
    setDayTypeOverrides((prev) => ({ ...prev, [dayIndex]: type }));
  }

  function handleKrachtTypeChange(dayIndex: number, type: KrachtType) {
    setKrachtTypeOverrides((prev) => ({ ...prev, [dayIndex]: type }));
  }

  const schedule = DEFAULT_SCHEDULE.map((day) => {
    const override = dayTypeOverrides[day.dayIndex] as DayType | undefined;
    return { ...day, type: (override ?? day.type) as DayType };
  });

  return (
    <div className="min-h-screen px-4 pt-8 pb-4">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display text-4xl font-black">Werkschema</h1>
        <p className="text-muted-foreground mt-1">
          Kies per dag het type training
        </p>
      </motion.div>

      <div className="space-y-3" data-ocid="werkschema.list">
        {schedule.map((day, i) => {
          const isToday = day.dayIndex === todayIndex;
          const selectedKracht = krachtTypeOverrides[day.dayIndex];
          return (
            <motion.div
              key={day.dayIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              data-ocid={`werkschema.item.${i + 1}`}
            >
              <Card
                className={`border transition-all ${isToday ? "border-primary/60 bg-primary/5" : "border-border bg-card"}`}
              >
                <div className="px-4 py-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-display font-black text-sm ${isToday ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
                    >
                      {day.shortName}
                    </div>
                    <span
                      className={`font-display font-bold ${isToday ? "text-primary" : "text-foreground"}`}
                    >
                      {day.name}
                    </span>
                    {isToday && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-semibold">
                        Vandaag
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {DAY_OPTIONS.map(({ value, label, Icon, activeClass }) => {
                      const isActive = day.type === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleTypeChange(day.dayIndex, value)}
                          className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl border text-xs font-semibold transition-all ${isActive ? activeClass : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                          data-ocid={`werkschema.toggle.${i + 1}`}
                        >
                          <Icon size={16} />
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {day.type === "kracht" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">
                            Training type
                          </p>
                          <div className="grid grid-cols-5 gap-1.5">
                            {KRACHT_OPTIONS.map(({ value, label }) => {
                              const isActive = selectedKracht === value;
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() =>
                                    handleKrachtTypeChange(day.dayIndex, value)
                                  }
                                  className={`py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                                    isActive
                                      ? "bg-primary/20 text-primary border-primary/50"
                                      : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                  }`}
                                  data-ocid={`werkschema.kracht.toggle.${i + 1}`}
                                >
                                  {label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

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
