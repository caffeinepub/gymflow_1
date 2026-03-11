import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarCheck2,
  CalendarDays,
  Dumbbell,
  TrendingUp,
} from "lucide-react";

const tabs = [
  { to: "/" as const, label: "Vandaag", Icon: Dumbbell },
  { to: "/schema" as const, label: "Schema", Icon: CalendarDays },
  { to: "/werkschema" as const, label: "Werkschema", Icon: CalendarCheck2 },
  { to: "/voortgang" as const, label: "Voortgang", Icon: TrendingUp },
];

export function BottomNav() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch h-16 px-2">
        {tabs.map(({ to, label, Icon }) => {
          const isActive =
            to === "/" ? currentPath === "/" : currentPath.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px] relative"
              data-ocid={`nav.${label.toLowerCase().replace(/ /g, "_")}.link`}
            >
              <div
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground glow-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon
                  size={20}
                  className="transition-transform"
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span
                  className={`text-[10px] font-medium tracking-wide ${isActive ? "font-bold" : ""}`}
                >
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
