import React from "react";
import { useApp } from "@/context/AppContext";
import { getCategory } from "@/lib/categories";
import { distanceMeters, formatDistance } from "@/lib/geo";
import { Pencil, Trash2, Share2 } from "lucide-react";
import ActionToggle from "@/components/ActionToggle";

export default function PlaceCard({ place, onEdit, onDelete, onShare, compact = false }) {
  const { t, location, insidePlaceIds, editPlace } = useApp();
  const cat = getCategory(place.category);
  const Icon = cat.icon;
  const inside = insidePlaceIds.has(place.id);
  const dist = location ? distanceMeters(location.lat, location.lng, place.lat, place.lng) : null;

  const handleActionChange = async (next) => {
    if (next === place.action) return;
    try {
      await editPlace(place.id, { action: next });
    } catch (e) {
      console.error("update action failed", e);
    }
  };

  return (
    <div
      data-testid={`place-card-${place.id}`}
      className={`qz-card p-4 flex items-center gap-4 transition-all ${
        inside ? "ring-2 ring-[#7B9E87]/60 shadow-md shadow-[#7B9E87]/15" : ""
      }`}
    >
      <div
        className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center"
        style={{ background: `${cat.color}1a`, color: cat.color }}
      >
        <Icon size={22} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-[#1C2833] truncate">{place.name}</h3>
          {inside && (
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#7B9E87] bg-[#7B9E87]/10 px-2 py-0.5 rounded-full">
              {t.status.inside}
            </span>
          )}
          {!place.enabled && (
            <span className="text-[10px] uppercase tracking-wider font-medium text-[#5D6D7E] bg-black/5 px-2 py-0.5 rounded-full">
              off
            </span>
          )}
        </div>
        <p className="text-xs text-[#5D6D7E] mt-0.5">
          {t.categories[place.category]} · {place.radius_m} {t.common.meters_short}
          {dist != null && (
            <span className="ms-1">· {formatDistance(dist)} {t.common.away}</span>
          )}
        </p>
        {!compact && place.notes && (
          <p className="text-xs text-[#5D6D7E] mt-1 italic line-clamp-1">{place.notes}</p>
        )}
        <div className="mt-2">
          <ActionToggle
            value={place.action || "silent"}
            onChange={handleActionChange}
            compact={compact}
            testid={`action-toggle-${place.id}`}
          />
        </div>
      </div>
      {!compact && (
        <div className="flex items-center gap-1">
          <button
            data-testid={`share-place-${place.id}`}
            onClick={() => onShare && onShare(place)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#2C3E50] hover:bg-black/5 transition"
            aria-label="share"
          >
            <Share2 size={16} />
          </button>
          <button
            data-testid={`edit-place-${place.id}`}
            onClick={() => onEdit && onEdit(place)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#5D6D7E] hover:bg-black/5 transition"
          >
            <Pencil size={16} />
          </button>
          <button
            data-testid={`delete-place-${place.id}`}
            onClick={() => onDelete && onDelete(place)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#B85C5C] hover:bg-[#B85C5C]/10 transition"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
