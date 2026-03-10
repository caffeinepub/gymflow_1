import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface WorkoutSet {
    weight: number;
    reps: bigint;
}
export interface WorkoutSession {
    date: string;
    exercises: Array<ExerciseLog>;
    dayType: DayType;
}
export interface ExerciseLog {
    exerciseId: bigint;
    sets: Array<WorkoutSet>;
    exerciseName: string;
}
export enum DayType {
    rust = "rust",
    kracht = "kracht",
    cardio = "cardio"
}
export interface backendInterface {
    getAllLogs(): Promise<Array<WorkoutSession>>;
    logWorkout(workoutSession: WorkoutSession): Promise<void>;
    register(): Promise<void>;
    updateSchedule(dayIndex: bigint, dayType: DayType): Promise<void>;
}
