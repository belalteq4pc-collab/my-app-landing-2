import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, MapPin, X } from "lucide-react";
import { useApp } from "@/context/AppContext";

/**
 * Improved geocoding search using Nominatim (OpenStreetMap free API).
 * Enhancements:
 *  - User-location bias (viewbox) so nearby results rank higher
 *  - Larger result limit
 *  - Multi-language results (uses current UI language)
 *  - Shows place type (amenity/building) badge
 *  - Calls onSelect({ lat, lng, name, display_name, category }) when result picked.
 */

function inferCategory(item) {
  // Map Nominatim "type" / "class" to our app categories
  const t = (item.type || "").toLowerCase();
  const c = (item.class || "").toLowerCase();
  if (t === "mosque" || c === "mosque") return "mosque";
  if (t === "place_of_worship" && (item.address?.religion === "christian")) return "church";
  if (t === "church" || c === "church") return "church";
  if (t === "school" || c === "school") return "school";
  if (t === "university" || t === "college") return "university";
  if (t === "hospital" || t === "clinic") return "hospital";
  if (t === "library") return "library";
  if (c === "office" || t === "office") return "work";
  if (t === "house" || t === "residential") return "home";
  return null;
}

export default function PlaceSearch({ onSelect, placeholder }) {
  const { settings, location } = useApp();
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        // Build URL with location bias when available (boosts nearby results)
        const params = new URLSearchParams({
          format: "json",
          limit: "10",
          addressdetails: "1",
          extratags: "1",
          namedetails: "1",
          "accept-language": settings.lang,
          q: q.trim(),
        });
        if (location) {
          // viewbox = left,top,right,bottom; ~0.5 degree (~55km) window centered on user
          const d = 0.5;
          params.set("viewbox", `${location.lng - d},${location.lat + d},${location.lng + d},${location.lat - d}`);
          params.set("bounded", "0"); // 0 = bias but allow outside; 1 = strict
        }
        const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
        const res = await fetch(url, { signal: ac.signal });
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch (e) {
        if (e.name !== "AbortError") console.warn("search error", e);
      } finally {
        setLoading(false);
      }
    }, 450);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [q, settings.lang, location]);

  const handlePick = (r) => {
    setOpen(false);
    setQ("");
    setResults([]);
    const category = inferCategory(r);
    onSelect &&
      onSelect({
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        name: r.namedetails?.name || r.name || r.display_name?.split(",")[0] || "",
        display_name: r.display_name,
        category,
      });
  };

  return (
    <div className="relative" data-testid="place-search">
      <div className="flex items-center gap-2 bg-[#F7F5F0] rounded-xl border border-black/5 px-3 py-2.5">
        <Search size={16} className="text-[#5D6D7E] shrink-0" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          data-testid="place-search-input"
          className="flex-1 bg-transparent text-sm outline-none min-w-0"
        />
        {loading && <Loader2 size={14} className="animate-spin text-[#5D6D7E]" />}
        {q && !loading && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setResults([]);
            }}
            className="text-[#5D6D7E] hover:text-[#1C2833]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute z-50 mt-1 left-0 right-0 bg-white rounded-xl border border-black/10 shadow-lg overflow-hidden max-h-64 overflow-y-auto"
          data-testid="search-results"
        >
          {results.map((r, i) => {
            const title = r.namedetails?.name || r.name || r.display_name?.split(",")[0];
            const typeLabel = r.type ? r.type.replace(/_/g, " ") : null;
            return (
              <button
                type="button"
                key={`${r.place_id}-${i}`}
                onClick={() => handlePick(r)}
                data-testid={`search-result-${i}`}
                className="w-full text-start px-3 py-2.5 hover:bg-[#F7F5F0] transition flex items-start gap-2 border-b border-black/5 last:border-b-0"
              >
                <MapPin size={14} className="text-[#E87A5D] mt-1 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1C2833] truncate">{title}</p>
                  <p className="text-[11px] text-[#5D6D7E] line-clamp-1">{r.display_name}</p>
                </div>
                {typeLabel && (
                  <span className="text-[9px] uppercase tracking-wider font-bold text-[#5D6D7E] bg-black/5 px-1.5 py-0.5 rounded mt-1 shrink-0">
                    {typeLabel.length > 14 ? typeLabel.slice(0, 14) : typeLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {open && !loading && q.trim().length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-1 left-0 right-0 bg-white rounded-xl border border-black/10 shadow-lg p-4 text-center">
          <p className="text-xs text-[#5D6D7E]">No results — try a different query</p>
        </div>
      )}
    </div>
  );
}
