import React from "react";
import { NavLink } from "react-router-dom";
import { Map as MapIcon, List, History, Settings } from "lucide-react";
import { useApp } from "@/context/AppContext";

const items = [
  { to: "/", key: "home", icon: MapIcon, testid: "bottom-nav-home" },
  { to: "/places", key: "places", icon: List, testid: "bottom-nav-places" },
  { to: "/history", key: "history", icon: History, testid: "bottom-nav-history" },
  { to: "/settings", key: "settings", icon: Settings, testid: "bottom-nav-settings" },
];

export default function BottomNav() {
  const { t } = useApp();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 qz-glass border-t border-black/5 pb-safe pt-2 px-3 flex justify-around items-center h-[72px]"
      data-testid="bottom-nav"
    >
      {items.map(({ to, key, icon: Icon, testid }) => (
        <NavLink
          key={key}
          to={to}
          end={to === "/"}
          data-testid={testid}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 ${
              isActive
                ? "text-[#E87A5D] -translate-y-0.5"
                : "text-[#5D6D7E] hover:text-[#2C3E50]"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
              <span className="text-[11px] font-medium tracking-wide">
                {t.nav[key]}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
