import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import PlaceCard from "@/components/PlaceCard";
import AddPlaceDialog from "@/components/AddPlaceDialog";
import ShareDialog from "@/components/ShareDialog";
import { Plus, MapPin, Share2 } from "lucide-react";

export default function PlacesPage() {
  const { t, places, removePlace } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMode, setShareMode] = useState("place");
  const [sharePlace, setSharePlace] = useState(null);

  const handleEdit = (p) => {
    setEditing(p);
    setDialogOpen(true);
  };

  const handleDelete = async (p) => {
    if (!confirm(`${t.actions.delete}: ${p.name}?`)) return;
    await removePlace(p.id);
  };

  const handleShare = (p) => {
    setSharePlace(p);
    setShareMode("place");
    setShareOpen(true);
  };

  const handleShareAll = () => {
    setSharePlace(null);
    setShareMode("all");
    setShareOpen(true);
  };

  return (
    <div className="px-5 pt-6 pb-28">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1C2833] tracking-tight">
            {t.nav.places}
          </h1>
          <p className="text-sm text-[#5D6D7E] mt-0.5">
            {places.length} {t.nav.places.toLowerCase()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {places.length > 0 && (
            <button
              onClick={handleShareAll}
              data-testid="share-all-btn"
              className="w-11 h-11 rounded-full bg-[#2C3E50] text-white shadow-md shadow-[#2C3E50]/20 flex items-center justify-center hover:bg-[#1C2833] active:scale-95 transition"
              aria-label={t.share.share_all}
            >
              <Share2 size={18} />
            </button>
          )}
          <button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            data-testid="add-place-header-btn"
            className="w-11 h-11 rounded-full bg-[#E87A5D] text-white shadow-md shadow-[#E87A5D]/30 flex items-center justify-center hover:bg-[#D36A4F] active:scale-95 transition"
          >
            <Plus size={22} strokeWidth={2.4} />
          </button>
        </div>
      </header>

      {places.length === 0 ? (
        <div className="qz-card p-10 text-center mt-12">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#F7F5F0] flex items-center justify-center mb-3">
            <MapPin className="text-[#5D6D7E]" size={28} />
          </div>
          <p className="font-medium text-[#1C2833]">{t.home.no_places}</p>
          <p className="text-sm text-[#5D6D7E] mt-1">{t.home.no_places_hint}</p>
        </div>
      ) : (
        <div className="space-y-3 qz-fade-up">
          {places.map((p) => (
            <PlaceCard
              key={p.id}
              place={p}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onShare={handleShare}
            />
          ))}
        </div>
      )}

      <AddPlaceDialog
        open={dialogOpen}
        editing={editing}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
      />

      <ShareDialog
        open={shareOpen}
        mode={shareMode}
        place={sharePlace}
        onClose={() => setShareOpen(false)}
      />
    </div>
  );
}
