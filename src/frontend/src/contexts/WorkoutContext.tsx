import { createContext, useContext, useState } from "react";
import type { ExerciseOption } from "../data/exercises";

export interface ActiveWorkoutData {
  exercises: ExerciseOption[];
  dayName: string;
  dayLabel: string;
  dayType: string;
}

interface WorkoutContextValue {
  activeWorkout: ActiveWorkoutData | null;
  startWorkout: (data: ActiveWorkoutData) => void;
  clearWorkout: () => void;
}

const WorkoutContext = createContext<WorkoutContextValue>({
  activeWorkout: null,
  startWorkout: () => {},
  clearWorkout: () => {},
});

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutData | null>(
    null,
  );

  function startWorkout(data: ActiveWorkoutData) {
    setActiveWorkout(data);
  }

  function clearWorkout() {
    setActiveWorkout(null);
  }

  return (
    <WorkoutContext.Provider
      value={{ activeWorkout, startWorkout, clearWorkout }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkoutContext() {
  return useContext(WorkoutContext);
}
