import { Card } from "@/components/ui/card";
import { Moon, Wind, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { DEFAULT_SCHEDULE } from "../data/exercises";
import { useLocalStorage } from "../hooks/useLocalStorage";

type DayType = "kracht" | "cardio" | "rust";
type KrachtType = "push" | "pull" | "legs" | "upper" | "lower";
type CardioType = "fietsen" | "lopen" | "stairmaster" | "handmatig";

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

const CARDIO_OPTIONS: { value: CardioType; label: string; emoji: string }[] = [
  { value: "fietsen", label: "Fietsen", emoji: "🚴" },
  { value: "lopen", label: "Lopen", emoji: "🏃" },
  { value: "stairmaster", label: "Stairmaster", emoji: "🪜" },
  { value: "handmatig", label: "Handmatig", emoji: "✏️" },
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
  const [cardioTypeOverrides, setCardioTypeOverrides] = useLocalStorage<
    Record<number, CardioType>
  >("gymflow_cardio_types", {});
  const [cardioHandmatig, setCardioHandmatig] = useLocalStorage<
    Record<number, string>
  >("gymflow_cardio_handmatig", {});

  function handleTypeChange(dayIndex: number, type: DayType) {
    setDayTypeOverrides((prev) => ({ ...prev, [dayIndex]: type }));
  }

  function handleKrachtTypeChange(dayIndex: number, type: KrachtType) {
    setKrachtTypeOverrides((prev) => ({ ...prev, [dayIndex]: type }));
  }

  function handleCardioTypeChange(dayIndex: number, type: CardioType) {
    setCardioTypeOverrides((prev) => ({ ...prev, [dayIndex]: type }));
  }

  function handleCardioHandmatigChange(dayIndex: number, value: string) {
    setCardioHandmatig((prev) => ({ ...prev, [dayIndex]: value }));
  }

  const schedule = DEFAULT_SCHEDULE.map((day) => {
    const override = dayTypeOverrides[day.dayIndex] as DayType | undefined;
    return { ...day, type: (override ?? day.type) as DayType };
  });

  return (
    <div className="min-h-screen px-4 pt-6 pb-4 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        <h1 className="font-display text-3xl font-black">Werkschema</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Kies per dag het type training
        </p>
      </motion.div>

      <div className="space-y-2" data-ocid="werkschema.list">
        {schedule.map((day, i) => {
          const isToday = day.dayIndex === todayIndex;
          const selectedKracht = krachtTypeOverrides[day.dayIndex];
          const selectedCardio = cardioTypeOverrides[day.dayIndex];
          const handmatigValue = cardioHandmatig[day.dayIndex] ?? "";
          return (
            <motion.div
              key={day.dayIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              data-ocid={`werkschema.item.${i + 1}`}
            >
              <Card
                className={`border transition-all ${
                  isToday
                    ? "border-primary/60 bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <div className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-display font-black text-xs ${
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {day.shortName}
                    </div>
                    <span
                      className={`font-display font-bold text-sm ${
                        isToday ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {day.name}
                    </span>
                    {isToday && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 font-semibold">
                        Vandaag
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {DAY_OPTIONS.map(({ value, label, Icon, activeClass }) => {
                      const isActive = day.type === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleTypeChange(day.dayIndex, value)}
                          className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl border text-xs font-semibold transition-all ${
                            isActive
                              ? activeClass
                              : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
                          }`}
                          data-ocid={`werkschema.toggle.${i + 1}`}
                        >
                          <Icon size={13} />
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {day.type === "kracht" && (
                      <motion.div
                        key="kracht"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2.5 pt-2.5 border-t border-border/50">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                            Training type
                          </p>
                          <div className="grid grid-cols-5 gap-1">
                            {KRACHT_OPTIONS.map(({ value, label }) => {
                              const isActive = selectedKracht === value;
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() =>
                                    handleKrachtTypeChange(day.dayIndex, value)
                                  }
                                  className={`py-1.5 rounded-lg border text-[10px] font-semibold transition-all ${
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

                    {day.type === "cardio" && (
                      <motion.div
                        key="cardio"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2.5 pt-2.5 border-t border-border/50">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                            Cardio type
                          </p>
                          <div className="grid grid-cols-4 gap-1">
                            {CARDIO_OPTIONS.map(({ value, label, emoji }) => {
                              const isActive = selectedCardio === value;
                              return (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() =>
                                    handleCardioTypeChange(day.dayIndex, value)
                                  }
                                  className={`py-1.5 px-1 rounded-lg text-[10px] font-semibold transition-all flex flex-col items-center gap-0.5 ${
                                    isActive
                                      ? "bg-accent/20 text-accent border-2 border-accent"
                                      : "border border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary"
                                  }`}
                                  data-ocid={`werkschema.cardio.toggle.${i + 1}`}
                                >
                                  <span className="text-base leading-none">
                                    {emoji}
                                  </span>
                                  {label}
                                </button>
                              );
                            })}
                          </div>

                          <AnimatePresence>
                            {selectedCardio === "handmatig" && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.15 }}
                                className="overflow-hidden"
                              >
                                <input
                                  type="text"
                                  value={handmatigValue}
                                  onChange={(e) =>
                                    handleCardioHandmatigChange(
                                      day.dayIndex,
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Bijv. zwemmen, roeien..."
                                  className="mt-2 w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent/60 focus:bg-secondary/60 transition-all"
                                  data-ocid={`werkschema.cardio.handmatig.input.${i + 1}`}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
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
