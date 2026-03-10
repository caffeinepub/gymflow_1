import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WorkoutSession } from "../backend";
import { useActor } from "./useActor";

export function useGetAllLogs() {
  const { actor, isFetching } = useActor();
  return useQuery<WorkoutSession[]>({
    queryKey: ["logs"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllLogs();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useLogWorkout() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (session: WorkoutSession) => {
      if (!actor) throw new Error("No actor");
      await actor.logWorkout(session);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logs"] });
    },
  });
}
