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
      <div className="flex items-stretch h-16">
        {tabs.map(({ to, label, Icon }) => {
          const isActive =
            to === "/" ? currentPath === "/" : currentPath.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-body transition-colors min-h-[44px] ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid={`nav.${label.toLowerCase().replace(/ /g, "_")}.link`}
            >
              <Icon
                size={20}
                className={`transition-transform ${isActive ? "scale-110" : ""}`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className="font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
