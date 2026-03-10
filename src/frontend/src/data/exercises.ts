export type DayTypeStr = "rust" | "kracht" | "cardio";

export interface ExerciseOption {
  id: number;
  name: string;
  equipment: string;
  muscleGroup: string;
}

export interface Exercise extends ExerciseOption {
  alternatives: ExerciseOption[];
  category: "push" | "pull" | "legs" | "upper" | "cardio";
}

export interface ScheduleDay {
  dayIndex: number;
  name: string;
  shortName: string;
  type: DayTypeStr;
  label: string;
  exerciseIds: number[];
}

// Alternative pool (ids 101+)
const A = (
  id: number,
  name: string,
  equipment: string,
  muscleGroup: string,
): ExerciseOption => ({
  id,
  name,
  equipment,
  muscleGroup,
});

export const EXERCISES: Record<number, Exercise> = {
  // ── Push ──────────────────────────────────────────────────────────────────
  1: {
    id: 1,
    name: "Bankdrukken",
    equipment: "Barbell",
    muscleGroup: "Borst",
    category: "push",
    alternatives: [
      A(19, "Dumbbell Bench Press", "Dumbbell", "Borst"),
      A(102, "Cable Fly", "Cable", "Borst"),
    ],
  },
  2: {
    id: 2,
    name: "Incline Dumbbell Press",
    equipment: "Dumbbell",
    muscleGroup: "Borst",
    category: "push",
    alternatives: [
      A(103, "Incline Barbell Press", "Barbell", "Borst"),
      A(104, "Pec Deck", "Machine", "Borst"),
    ],
  },
  3: {
    id: 3,
    name: "Kabelkruisen",
    equipment: "Cable",
    muscleGroup: "Borst",
    category: "push",
    alternatives: [
      A(105, "Dumbbell Fly", "Dumbbell", "Borst"),
      A(106, "Chest Press Machine", "Machine", "Borst"),
    ],
  },
  4: {
    id: 4,
    name: "Schouderdrukken",
    equipment: "Barbell",
    muscleGroup: "Schouders",
    category: "push",
    alternatives: [
      A(107, "Dumbbell Shoulder Press", "Dumbbell", "Schouders"),
      A(108, "Machine Shoulder Press", "Machine", "Schouders"),
    ],
  },
  5: {
    id: 5,
    name: "Zijwaartse Raises",
    equipment: "Dumbbell",
    muscleGroup: "Schouders",
    category: "push",
    alternatives: [
      A(109, "Cable Side Raise", "Cable", "Schouders"),
      A(110, "Machine Lateral Raise", "Machine", "Schouders"),
    ],
  },
  6: {
    id: 6,
    name: "Triceps Pushdown",
    equipment: "Cable",
    muscleGroup: "Triceps",
    category: "push",
    alternatives: [
      A(111, "Overhead Triceps Extension", "Cable", "Triceps"),
      A(112, "Skullcrusher", "Barbell", "Triceps"),
    ],
  },

  // ── Pull ──────────────────────────────────────────────────────────────────
  7: {
    id: 7,
    name: "Deadlift",
    equipment: "Barbell",
    muscleGroup: "Rug",
    category: "pull",
    alternatives: [
      A(113, "Romanian Deadlift", "Barbell", "Billen/Hamstrings"),
      A(114, "Trap Bar Deadlift", "Trap Bar", "Rug"),
    ],
  },
  8: {
    id: 8,
    name: "Barbell Row",
    equipment: "Barbell",
    muscleGroup: "Rug",
    category: "pull",
    alternatives: [
      A(115, "Dumbbell Row", "Dumbbell", "Rug"),
      A(116, "Cable Row", "Cable", "Rug"),
    ],
  },
  9: {
    id: 9,
    name: "Lat Pulldown",
    equipment: "Machine",
    muscleGroup: "Rug",
    category: "pull",
    alternatives: [
      A(117, "Pull-ups", "Eigen gewicht", "Rug"),
      A(118, "Cable Pulldown", "Cable", "Rug"),
    ],
  },
  10: {
    id: 10,
    name: "Facepull",
    equipment: "Cable",
    muscleGroup: "Schouders/Rug",
    category: "pull",
    alternatives: [
      A(119, "Rear Delt Fly", "Dumbbell", "Schouders"),
      A(120, "Band Pull-Apart", "Band", "Schouders"),
    ],
  },
  11: {
    id: 11,
    name: "Barbell Curl",
    equipment: "Barbell",
    muscleGroup: "Biceps",
    category: "pull",
    alternatives: [
      A(121, "Dumbbell Curl", "Dumbbell", "Biceps"),
      A(122, "Cable Curl", "Cable", "Biceps"),
    ],
  },
  12: {
    id: 12,
    name: "Hammer Curl",
    equipment: "Dumbbell",
    muscleGroup: "Biceps",
    category: "pull",
    alternatives: [
      A(123, "Incline Curl", "Dumbbell", "Biceps"),
      A(124, "Preacher Curl", "Machine", "Biceps"),
    ],
  },

  // ── Legs ──────────────────────────────────────────────────────────────────
  13: {
    id: 13,
    name: "Squat",
    equipment: "Barbell",
    muscleGroup: "Benen/Billen",
    category: "legs",
    alternatives: [
      A(125, "Hack Squat", "Machine", "Benen/Billen"),
      A(126, "Leg Press", "Machine", "Benen/Billen"),
    ],
  },
  14: {
    id: 14,
    name: "Leg Press",
    equipment: "Machine",
    muscleGroup: "Benen/Billen",
    category: "legs",
    alternatives: [
      A(127, "Bulgarian Split Squat", "Dumbbell", "Benen/Billen"),
      A(128, "Smith Machine Squat", "Smith Machine", "Benen/Billen"),
    ],
  },
  15: {
    id: 15,
    name: "Romanian Deadlift",
    equipment: "Barbell",
    muscleGroup: "Billen/Hamstrings",
    category: "legs",
    alternatives: [
      A(129, "Leg Curl", "Machine", "Hamstrings"),
      A(130, "Nordic Curl", "Eigen gewicht", "Hamstrings"),
    ],
  },
  16: {
    id: 16,
    name: "Leg Curl",
    equipment: "Machine",
    muscleGroup: "Hamstrings",
    category: "legs",
    alternatives: [
      A(131, "Stiff Leg Deadlift", "Barbell", "Hamstrings"),
      A(132, "Swiss Ball Curl", "Swiss Ball", "Hamstrings"),
    ],
  },
  17: {
    id: 17,
    name: "Leg Extension",
    equipment: "Machine",
    muscleGroup: "Quadriceps",
    category: "legs",
    alternatives: [
      A(133, "Terminal Knee Extension", "Band", "Quadriceps"),
      A(134, "Step-Up", "Dumbbell", "Quadriceps"),
    ],
  },
  18: {
    id: 18,
    name: "Kuitverheffing",
    equipment: "Machine",
    muscleGroup: "Kuiten",
    category: "legs",
    alternatives: [
      A(135, "Standing Calf Raise", "Barbell", "Kuiten"),
      A(136, "Seated Calf Raise", "Machine", "Kuiten"),
    ],
  },

  // ── Upper ─────────────────────────────────────────────────────────────────
  19: {
    id: 19,
    name: "Dumbbell Bench Press",
    equipment: "Dumbbell",
    muscleGroup: "Borst",
    category: "upper",
    alternatives: [
      A(1, "Bankdrukken", "Barbell", "Borst"),
      A(102, "Cable Fly", "Cable", "Borst"),
    ],
  },
  20: {
    id: 20,
    name: "Seated Cable Row",
    equipment: "Cable",
    muscleGroup: "Rug",
    category: "upper",
    alternatives: [
      A(137, "T-Bar Row", "Barbell", "Rug"),
      A(138, "Machine Row", "Machine", "Rug"),
    ],
  },
  21: {
    id: 21,
    name: "Arnold Press",
    equipment: "Dumbbell",
    muscleGroup: "Schouders",
    category: "upper",
    alternatives: [
      A(139, "Lateral Raise", "Dumbbell", "Schouders"),
      A(140, "Front Raise", "Dumbbell", "Schouders"),
    ],
  },
  22: {
    id: 22,
    name: "Chest Supported Row",
    equipment: "Machine",
    muscleGroup: "Rug",
    category: "upper",
    alternatives: [
      A(141, "Barbell Row", "Barbell", "Rug"),
      A(115, "Dumbbell Row", "Dumbbell", "Rug"),
    ],
  },

  // ── Cardio ────────────────────────────────────────────────────────────────
  23: {
    id: 23,
    name: "Fietsen",
    equipment: "Cardio machine",
    muscleGroup: "Conditie",
    category: "cardio",
    alternatives: [A(142, "Crosstrainer", "Cardio machine", "Conditie")],
  },
  24: {
    id: 24,
    name: "Stairmaster",
    equipment: "Cardio machine",
    muscleGroup: "Conditie",
    category: "cardio",
    alternatives: [A(143, "Stepmill", "Cardio machine", "Conditie")],
  },
  25: {
    id: 25,
    name: "Loopband",
    equipment: "Cardio machine",
    muscleGroup: "Conditie",
    category: "cardio",
    alternatives: [A(144, "Buiten Hardlopen", "Geen", "Conditie")],
  },
  26: {
    id: 26,
    name: "Roeimachine",
    equipment: "Cardio machine",
    muscleGroup: "Conditie",
    category: "cardio",
    alternatives: [A(145, "Ski Erg", "Cardio machine", "Conditie")],
  },
  27: {
    id: 27,
    name: "Crosstrainer",
    equipment: "Cardio machine",
    muscleGroup: "Conditie",
    category: "cardio",
    alternatives: [A(23, "Fietsen", "Cardio machine", "Conditie")],
  },
};

export const DEFAULT_SCHEDULE: ScheduleDay[] = [
  {
    dayIndex: 0,
    name: "Maandag",
    shortName: "Ma",
    type: "kracht",
    label: "Push",
    exerciseIds: [1, 2, 3, 4, 5, 6],
  },
  {
    dayIndex: 1,
    name: "Dinsdag",
    shortName: "Di",
    type: "kracht",
    label: "Pull",
    exerciseIds: [7, 8, 9, 10, 11, 12],
  },
  {
    dayIndex: 2,
    name: "Woensdag",
    shortName: "Wo",
    type: "cardio",
    label: "Cardio",
    exerciseIds: [23, 24],
  },
  {
    dayIndex: 3,
    name: "Donderdag",
    shortName: "Do",
    type: "kracht",
    label: "Benen & Billen",
    exerciseIds: [13, 14, 15, 16, 17, 18],
  },
  {
    dayIndex: 4,
    name: "Vrijdag",
    shortName: "Vr",
    type: "kracht",
    label: "Upper Body",
    exerciseIds: [1, 20, 21, 22, 5, 6],
  },
  {
    dayIndex: 5,
    name: "Zaterdag",
    shortName: "Za",
    type: "cardio",
    label: "Cardio",
    exerciseIds: [25, 26],
  },
  {
    dayIndex: 6,
    name: "Zondag",
    shortName: "Zo",
    type: "rust",
    label: "Rust",
    exerciseIds: [],
  },
];

export const MUSCLE_GROUP_COLORS: Record<string, string> = {
  Borst: "#f97316",
  Schouders: "#fb923c",
  Triceps: "#fdba74",
  Rug: "#22d3ee",
  Biceps: "#67e8f9",
  "Benen/Billen": "#a78bfa",
  "Billen/Hamstrings": "#c4b5fd",
  Hamstrings: "#ddd6fe",
  Quadriceps: "#818cf8",
  Kuiten: "#6366f1",
  Conditie: "#34d399",
  "Schouders/Rug": "#38bdf8",
};
