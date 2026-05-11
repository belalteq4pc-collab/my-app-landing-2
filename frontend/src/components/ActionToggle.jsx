import React from "react";
import { useApp } from "@/context/AppContext";
import { BellOff, Bell } from "lucide-react";

/**
 * Two-segment pill: [Silent (red) | Ring (green)]
 * Props:
 *   - value: "silent" | "ring"
 *   - onChange(newValue)
 *   - compact: smaller version
 */
export default function ActionToggle({ value = "silent", onChange, compact = false, testid }) {
  const { t } = useApp();
  const isSilent = value === "silent";
  const pad = compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-[11px]";

  return (
    <div
      className="inline-flex items-center bg-black/5 rounded-full p-0.5 select-none"
      data-testid={testid || "action-toggle"}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange && onChange("silent");
        }}
        data-testid={`${testid || "action-toggle"}-silent`}
        className={`${pad} rounded-full flex items-center gap-1 font-semibold tracking-wide transition-all ${
          isSilent
            ? "bg-[#B85C5C] text-white shadow-sm shadow-[#B85C5C]/30"
            : "text-[#5D6D7E] hover:text-[#1C2833]"
        }`}
        aria-label={t.action.silent}
      >
        <BellOff size={compact ? 10 : 12} strokeWidth={2.4} />
        {t.action.silent}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange && onChange("ring");
        }}
        data-testid={`${testid || "action-toggle"}-ring`}
        className={`${pad} rounded-full flex items-center gap-1 font-semibold tracking-wide transition-all ${
          !isSilent
            ? "bg-[#7B9E87] text-white shadow-sm shadow-[#7B9E87]/30"
            : "text-[#5D6D7E] hover:text-[#1C2833]"
        }`}
        aria-label={t.action.ring}
      >
        <Bell size={compact ? 10 : 12} strokeWidth={2.4} />
        {t.action.ring}
      </button>
    </div>
  );
}
