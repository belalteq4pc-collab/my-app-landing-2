import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { CATEGORIES } from "@/lib/categories";
import { X, Crosshair, Loader2 } from "lucide-react";
import PlaceSearch from "@/components/PlaceSearch";
import MapPicker from "@/components/MapPicker";
import ActionToggle from "@/components/ActionToggle";

export default function AddPlaceDialog({ open, onClose, editing }) {
  const { t, settings, addPlace, editPlace, location } = useApp();
  const isEdit = !!editing;

  const [form, setForm] = useState({
    name: "",
    category: "mosque",
    lat: "",
    lng: "",
    radius_m: settings.defaultRadius,
    notes: "",
    enabled: true,
    action: "silent",
  });
  const [saving, setSaving] = useState(false);
  const [pickingLoc, setPickingLoc] = useState(false);
  const [flyTrigger, setFlyTrigger] = useState(0);

  // Initialize form ONLY when dialog opens (NOT on every GPS update)
  // location is read once at open time, then ignored to avoid clobbering user input.
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name || "",
        category: editing.category || "other",
        lat: String(editing.lat ?? ""),
        lng: String(editing.lng ?? ""),
        radius_m: editing.radius_m ?? settings.defaultRadius,
        notes: editing.notes || "",
        enabled: editing.enabled !== false,
        action: editing.action || "silent",
      });
    } else {
      setForm({
        name: "",
        category: "mosque",
        lat: location ? String(location.lat.toFixed(6)) : "",
        lng: location ? String(location.lng.toFixed(6)) : "",
        radius_m: settings.defaultRadius,
        notes: "",
        enabled: true,
        action: "silent",
      });
    }
    setFlyTrigger((x) => x + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  if (!open) return null;

  const handleUseCurrent = () => {
    if (!("geolocation" in navigator)) return;
    setPickingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
        setFlyTrigger((x) => x + 1);
        setPickingLoc(false);
      },
      () => setPickingLoc(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearchSelect = (r) => {
    setForm((f) => ({
      ...f,
      name: f.name || r.name || "",
      lat: r.lat.toFixed(6),
      lng: r.lng.toFixed(6),
    }));
    setFlyTrigger((x) => x + 1);
  };

  const handleMapPick = ({ lat, lng }) => {
    setForm((f) => ({
      ...f,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.lat || !form.lng) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        radius_m: parseInt(form.radius_m, 10),
        notes: form.notes,
        enabled: form.enabled,
        action: form.action,
      };
      if (isEdit) {
        await editPlace(editing.id, payload);
      } else {
        await addPlace(payload);
      }
      onClose();
    } catch (e) {
      console.error(e);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm qz-fade-up"
      onClick={onClose}
      data-testid="add-place-dialog"
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white z-10 px-5 pt-5 pb-3 flex items-center justify-between border-b border-black/5">
          <h2 className="text-lg font-semibold text-[#1C2833]">
            {isEdit ? t.actions.edit : t.actions.add_place}
          </h2>
          <button
            onClick={onClose}
            data-testid="close-add-place"
            className="p-2 rounded-full hover:bg-black/5 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <PlaceSearch
            onSelect={handleSearchSelect}
            placeholder={t.actions.search_place}
          />

          <div>
            <label className="text-sm font-medium text-[#5D6D7E] mb-1.5 block">
              {t.place.name}
            </label>
            <input
              type="text"
              required
              data-testid="place-name-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t.place.name_ph}
              className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#E87A5D] focus:ring-2 focus:ring-[#E87A5D]/20 outline-none transition"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#5D6D7E] mb-2 block">
              {t.place.category}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                const active = form.category === c.key;
                return (
                  <button
                    type="button"
                    key={c.key}
                    data-testid={`category-${c.key}`}
                    onClick={() => setForm({ ...form, category: c.key })}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                      active
                        ? "border-[#E87A5D] bg-[#E87A5D]/10 text-[#E87A5D]"
                        : "border-black/10 text-[#5D6D7E] hover:bg-black/5"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-xs font-medium">
                      {t.categories[c.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-[#5D6D7E] mb-1.5 block">
                {t.place.lat}
              </label>
              <input
                type="number"
                step="any"
                required
                data-testid="place-lat-input"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-black/10 focus:border-[#E87A5D] focus:ring-2 focus:ring-[#E87A5D]/20 outline-none text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#5D6D7E] mb-1.5 block">
                {t.place.lng}
              </label>
              <input
                type="number"
                step="any"
                required
                data-testid="place-lng-input"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-black/10 focus:border-[#E87A5D] focus:ring-2 focus:ring-[#E87A5D]/20 outline-none text-sm"
              />
            </div>
          </div>

          <MapPicker
            lat={parseFloat(form.lat)}
            lng={parseFloat(form.lng)}
            radius_m={parseInt(form.radius_m, 10)}
            onPick={handleMapPick}
            flyTrigger={flyTrigger}
            height={220}
          />

          <button
            type="button"
            onClick={handleUseCurrent}
            data-testid="use-current-location-btn"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[#E87A5D]/40 text-[#E87A5D] hover:bg-[#E87A5D]/5 transition text-sm font-medium"
          >
            {pickingLoc ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Crosshair size={16} />
            )}
            {t.actions.use_current_location}
          </button>

          <div>
            <label className="text-sm font-medium text-[#5D6D7E] mb-1.5 flex justify-between">
              <span>{t.place.radius}</span>
              <span className="text-[#E87A5D] font-semibold">
                {form.radius_m} {t.place.meters}
              </span>
            </label>
            <input
              type="range"
              min={20}
              max={500}
              step={10}
              data-testid="place-radius-slider"
              value={form.radius_m}
              onChange={(e) =>
                setForm({ ...form, radius_m: parseInt(e.target.value, 10) })
              }
              className="w-full accent-[#E87A5D]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#5D6D7E] mb-1.5 block">
              {t.place.notes}
            </label>
            <textarea
              rows={2}
              data-testid="place-notes-input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder={t.place.notes_ph}
              className="w-full px-4 py-3 rounded-xl border border-black/10 focus:border-[#E87A5D] focus:ring-2 focus:ring-[#E87A5D]/20 outline-none text-sm resize-none"
            />
          </div>

          <div className="flex items-center justify-between bg-[#F7F5F0] rounded-xl px-4 py-3">
            <span className="text-sm font-medium text-[#1C2833]">
              {t.action.title}
            </span>
            <ActionToggle
              value={form.action}
              onChange={(v) => setForm({ ...form, action: v })}
              testid="dialog-action-toggle"
            />
          </div>

          <div className="flex items-center justify-between bg-[#F7F5F0] rounded-xl px-4 py-3">
            <span className="text-sm font-medium text-[#1C2833]">
              {t.place.enabled}
            </span>
            <button
              type="button"
              data-testid="place-enabled-toggle"
              onClick={() => setForm({ ...form, enabled: !form.enabled })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                form.enabled ? "bg-[#7B9E87]" : "bg-black/15"
              }`}
            >
              <span
                className={`absolute top-0.5 ${
                  form.enabled ? "start-[22px]" : "start-0.5"
                } w-5 h-5 bg-white rounded-full shadow transition-all`}
              />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              data-testid="cancel-place-btn"
              className="flex-1 py-3 rounded-xl border border-black/10 text-[#5D6D7E] font-medium hover:bg-black/5 transition"
            >
              {t.actions.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              data-testid="save-place-btn"
              className="flex-1 py-3 rounded-xl bg-[#E87A5D] text-white font-semibold hover:bg-[#D36A4F] active:scale-[0.98] transition disabled:opacity-60"
            >
              {saving ? t.common.saving : t.actions.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
