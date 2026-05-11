import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import MapView from "@/components/MapView";
import StatusPill from "@/components/StatusPill";
import PlaceCard from "@/components/PlaceCard";
import AddPlaceDialog from "@/components/AddPlaceDialog";
import { distanceMeters } from "@/lib/geo";
import { Plus, MapPin, Loader2, AlertTriangle } from "lucide-react";

export default function HomePage() {
  const { t, places, location, locError, startTracking, tracking, addPlace, settings } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const sortedNearby = useMemo(() => {
    if (!location) return places.slice(0, 3);
    return [...places]
      .map((p) => ({ ...p, _d: distanceMeters(location.lat, location.lng, p.lat, p.lng) }))
      .sort((a, b) => a._d - b._d)
      .slice(0, 3);
  }, [places, location]);

  const handleDemo = async () => {
    if (!location) {
      alert(t.home.grant_location);
      return;
    }
    await addPlace({
      name: "Demo Quiet Zone",
      category: "library",
      lat: location.lat + 0.0002,
      lng: location.lng + 0.0002,
      radius_m: 80,
      enabled: true,
      notes: "Auto-generated demo place",
    });
  };

  return (
    <div className="pb-28">
      <div className="relative">
        <MapView height="58vh" />
        <div className="absolute top-4 inset-x-0 flex justify-center z-30">
          <StatusPill />
        </div>
        {!location && locError === "denied" && (
          <div className="absolute inset-x-4 bottom-4 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg flex items-start gap-3">
            <AlertTriangle className="text-[#E87A5D] shrink-0 mt-0.5" size={20} />
            <div className="flex-1 text-sm">
              <p className="font-semibold text-[#1C2833]">{t.home.grant_location}</p>
              <button
                onClick={startTracking}
                data-testid="retry-location-btn"
                className="mt-2 text-xs font-medium text-[#E87A5D] underline"
              >
                {t.home.retry}
              </button>
            </div>
          </div>
        )}
      </div>

      <section className="px-5 mt-6 qz-fade-up">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-[#1C2833]">{t.home.nearby}</h2>
          <span className="text-xs text-[#5D6D7E]">{places.length}</span>
        </div>

        {places.length === 0 ? (
          <div className="qz-card p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#F7F5F0] flex items-center justify-center mb-3">
              <MapPin className="text-[#5D6D7E]" size={28} />
            </div>
            <p className="font-medium text-[#1C2833]">{t.home.no_places}</p>
            <p className="text-sm text-[#5D6D7E] mt-1 mb-4">{t.home.no_places_hint}</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                onClick={() => setDialogOpen(true)}
                data-testid="empty-add-btn"
                className="px-5 py-2.5 rounded-xl bg-[#E87A5D] text-white font-medium hover:bg-[#D36A4F] transition"
              >
                {t.actions.add_place}
              </button>
              <button
                onClick={handleDemo}
                data-testid="demo-place-btn"
                className="px-5 py-2.5 rounded-xl border border-black/10 text-[#2C3E50] font-medium hover:bg-black/5 transition"
              >
                {t.actions.try_demo}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedNearby.map((p) => (
              <PlaceCard key={p.id} place={p} compact />
            ))}
          </div>
        )}
      </section>

      <button
        onClick={() => {
          setEditing(null);
          setDialogOpen(true);
        }}
        data-testid="add-place-fab"
        className="fixed bottom-24 end-5 z-40 w-14 h-14 rounded-full bg-[#E87A5D] text-white shadow-lg shadow-[#E87A5D]/40 flex items-center justify-center hover:bg-[#D36A4F] active:scale-95 transition"
        aria-label={t.actions.add_place}
      >
        <Plus size={26} strokeWidth={2.4} />
      </button>

      <AddPlaceDialog
        open={dialogOpen}
        editing={editing}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
