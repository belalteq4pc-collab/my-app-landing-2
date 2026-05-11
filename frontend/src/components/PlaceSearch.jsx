import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, MapPin, X } from "lucide-react";
import { useApp } from "@/context/AppContext";

/**
 * Geocoding search using Nominatim (OpenStreetMap free API).
 * Calls onSelect({ lat, lng, name, display_name }) when result picked.
 */
export default function PlaceSearch({ onSelect, placeholder }) {
  const { settings } = useApp();
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
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&addressdetails=1&accept-language=${settings.lang}&q=${encodeURIComponent(q.trim())}`;
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
  }, [q, settings.lang]);

  const handlePick = (r) => {
    setOpen(false);
    setQ("");
    setResults([]);
    onSelect &&
      onSelect({
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        name: r.name || r.display_name?.split(",")[0] || "",
        display_name: r.display_name,
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
          {results.map((r, i) => (
            <button
              type="button"
              key={`${r.place_id}-${i}`}
              onClick={() => handlePick(r)}
              data-testid={`search-result-${i}`}
              className="w-full text-start px-3 py-2.5 hover:bg-[#F7F5F0] transition flex items-start gap-2 border-b border-black/5 last:border-b-0"
            >
              <MapPin size={14} className="text-[#E87A5D] mt-1 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1C2833] truncate">
                  {r.name || r.display_name.split(",")[0]}
                </p>
                <p className="text-[11px] text-[#5D6D7E] line-clamp-1">
                  {r.display_name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && !loading && q.trim().length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-1 left-0 right-0 bg-white rounded-xl border border-black/10 shadow-lg p-4 text-center">
          <p className="text-xs text-[#5D6D7E]">No results</p>
        </div>
      )}
    </div>
  );
}
