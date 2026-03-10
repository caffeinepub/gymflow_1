import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Dumbbell, Settings, TrendingUp } from "lucide-react";

const tabs = [
  { to: "/" as const, label: "Vandaag", Icon: Dumbbell },
  { to: "/schema" as const, label: "Schema", Icon: CalendarDays },
  { to: "/voortgang" as const, label: "Voortgang", Icon: TrendingUp },
  { to: "/instellingen" as const, label: "Instellingen", Icon: Settings },
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
              className={`flex flex-1 flex-col items-center justify-center gap-1 text-xs font-body transition-colors min-h-[44px] ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid={`nav.${label.toLowerCase()}.link`}
            >
              <Icon
                size={22}
                className={`transition-transform ${
                  isActive ? "scale-110" : ""
                }`}
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
