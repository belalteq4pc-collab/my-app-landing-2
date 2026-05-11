import React from "react";
import { useApp } from "@/context/AppContext";
import { getCategory } from "@/lib/categories";
import { LogIn, LogOut, History as HistoryIcon, Trash2 } from "lucide-react";

function formatTime(ts, lang) {
  try {
    const d = new Date(ts);
    return d.toLocaleString(lang === "ar" ? "ar-EG" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return ts;
  }
}

export default function HistoryPage() {
  const { t, visits, clearAllHistory, settings } = useApp();

  return (
    <div className="px-5 pt-6 pb-28">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2833] tracking-tight">
            {t.history.title}
          </h1>
          <p className="text-sm text-[#5D6D7E] mt-0.5">{visits.length} events</p>
        </div>
        {visits.length > 0 && (
          <button
            onClick={async () => {
              if (confirm(t.actions.clear_history + "?")) await clearAllHistory();
            }}
            data-testid="clear-history-btn"
            className="text-xs font-medium text-[#B85C5C] hover:bg-[#B85C5C]/10 px-3 py-2 rounded-full transition flex items-center gap-1.5"
          >
            <Trash2 size={14} />
            {t.actions.clear_history}
          </button>
        )}
      </header>

      {visits.length === 0 ? (
        <div className="qz-card p-10 text-center mt-12">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#F7F5F0] flex items-center justify-center mb-3">
            <HistoryIcon className="text-[#5D6D7E]" size={28} />
          </div>
          <p className="text-sm text-[#5D6D7E]">{t.history.empty}</p>
        </div>
      ) : (
        <div className="space-y-2 qz-fade-up">
          {visits.map((v) => {
            const cat = getCategory(v.category);
            const Icon = cat.icon;
            const isEnter = v.event === "enter";
            return (
              <div
                key={v.id}
                data-testid={`visit-${v.id}`}
                className="qz-card p-3.5 flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center"
                  style={{ background: `${cat.color}1a`, color: cat.color }}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isEnter
                          ? "text-[#7B9E87] bg-[#7B9E87]/10"
                          : "text-[#E87A5D] bg-[#E87A5D]/10"
                      }`}
                    >
                      {isEnter ? <LogIn size={10} /> : <LogOut size={10} />}
                      {isEnter ? t.history.entered : t.history.exited}
                    </span>
                    <p className="font-medium text-[#1C2833] truncate">{v.place_name}</p>
                  </div>
                  <p className="text-xs text-[#5D6D7E] mt-1">
                    {formatTime(v.timestamp, settings.lang)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
