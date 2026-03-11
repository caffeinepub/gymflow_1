import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarCheck2,
  CalendarDays,
  Dumbbell,
  History,
  TrendingUp,
} from "lucide-react";

const tabs = [
  { to: "/" as const, label: "Vandaag", Icon: Dumbbell },
  { to: "/schema" as const, label: "Schema", Icon: CalendarDays },
  { to: "/werkschema" as const, label: "Werkschema", Icon: CalendarCheck2 },
  { to: "/voortgang" as const, label: "Voortgang", Icon: TrendingUp },
  { to: "/geschiedenis" as const, label: "Geschiedenis", Icon: History },
];

export function SideNav() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <nav
      className="fixed left-0 top-0 h-full z-40 flex flex-col bg-card border-r border-border w-[72px] md:w-[200px]"
      aria-label="Hoofdnavigatie"
    >
      {/* Logo */}
      <div className="flex items-center justify-center md:justify-start px-0 md:px-4 h-16 shrink-0 border-b border-border">
        {/* Desktop: full logo */}
        <img
          src="/assets/generated/gymflow-logo-transparent.dim_300x80.png"
          alt="GymFlow"
          className="hidden md:block h-8 w-auto"
        />
        {/* Mobile: icon only */}
        <Dumbbell
          size={22}
          className="md:hidden text-primary"
          strokeWidth={2.5}
        />
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-1 p-2 flex-1">
        {tabs.map(({ to, label, Icon }) => {
          const isActive =
            to === "/" ? currentPath === "/" : currentPath.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-3 rounded-xl px-2 md:px-3 py-2.5 transition-all duration-200 relative"
              data-ocid={`nav.${label.toLowerCase().replace(/ /g, "_")}.link`}
            >
              <div
                className={`absolute inset-0 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-primary opacity-100"
                    : "bg-transparent group-hover:bg-secondary opacity-100"
                }`}
              />
              <Icon
                size={18}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={`relative z-10 shrink-0 transition-colors ${
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              />
              <span
                className={`relative z-10 hidden md:block text-sm font-semibold tracking-wide transition-colors ${
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="hidden md:block px-4 pb-4 text-[10px] text-muted-foreground/40 leading-relaxed">
        © {new Date().getFullYear()}
        <br />
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-muted-foreground transition-colors"
        >
          caffeine.ai
        </a>
      </div>
    </nav>
  );
}
