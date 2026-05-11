import React from "react";
import { Bell, BellOff, MapPin, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function StatusPill() {
  const { t, currentInsidePlace, tracking, location, locError } = useApp();

  let icon = <Bell size={16} strokeWidth={2} />;
  let label = t.status.normal;
  let extra = t.status.outside_all;
  let cls = "text-[#2C3E50] bg-white/90 border-black/5";

  if (currentInsidePlace) {
    icon = <BellOff size={16} strokeWidth={2.2} />;
    label = t.status.silent;
    extra = `${t.status.inside} · ${currentInsidePlace.name}`;
    cls = "text-[#7B9E87] bg-[#7B9E87]/10 border-[#7B9E87]/25 qz-pulse";
  } else if (!tracking) {
    icon = <MapPin size={16} strokeWidth={2} />;
    label = t.status.tracking_off;
    extra = "";
  } else if (!location && !locError) {
    icon = <Loader2 size={16} strokeWidth={2} className="animate-spin" />;
    label = t.home.no_location;
    extra = "";
  }

  return (
    <div
      data-testid="status-pill"
      className={`qz-glass border ${cls} px-4 py-2 rounded-full shadow-md shadow-black/5 flex items-center gap-2.5 max-w-[90vw]`}
    >
      <span className="flex items-center justify-center">{icon}</span>
      <div className="flex flex-col leading-tight">
        <span className="text-xs font-semibold tracking-wide">{label}</span>
        {extra ? (
          <span className="text-[10px] opacity-70 truncate max-w-[200px]">{extra}</span>
        ) : null}
      </div>
    </div>
  );
}
