import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { BottomNav } from "./components/BottomNav";
import { WorkoutProvider } from "./contexts/WorkoutContext";
import { useActor } from "./hooks/useActor";
import { ActiveWorkout } from "./pages/ActiveWorkout";
import { Schema } from "./pages/Schema";
import { Vandaag } from "./pages/Vandaag";
import { Voortgang } from "./pages/Voortgang";
import { Werkschema } from "./pages/Werkschema";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

function RegisterEffect() {
  const { actor } = useActor();
  useEffect(() => {
    if (actor) {
      actor.register().catch(() => {});
    }
  }, [actor]);
  return null;
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <RegisterEffect />
      <main className="pb-nav">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const mainLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "main",
  component: AppLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/",
  component: Vandaag,
});

const schemaRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/schema",
  component: Schema,
});

const voortgangRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/voortgang",
  component: Voortgang,
});

const werkschemaRoute = createRoute({
  getParentRoute: () => mainLayoutRoute,
  path: "/werkschema",
  component: Werkschema,
});

const workoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workout",
  component: ActiveWorkout,
});

const routeTree = rootRoute.addChildren([
  mainLayoutRoute.addChildren([
    indexRoute,
    schemaRoute,
    voortgangRoute,
    werkschemaRoute,
  ]),
  workoutRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WorkoutProvider>
        <RouterProvider router={router} />
        <Toaster />
      </WorkoutProvider>
    </QueryClientProvider>
  );
}
