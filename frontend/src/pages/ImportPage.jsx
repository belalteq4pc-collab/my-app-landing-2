import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import L from "leaflet";
import { getShare } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { getCategory } from "@/lib/categories";
import { tFormat } from "@/lib/i18n";
import { Check, Loader2, ArrowLeft, MapPin, Eye, BellOff, AlertTriangle, Download } from "lucide-react";

function placeIcon(category) {
  const cat = getCategory(category);
  return L.divIcon({
    className: "",
    html: `<div class="qz-place-marker" style="background:${cat.color}">
      <div style="width:18px;height:18px;background:#fff;border-radius:50%;"></div>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

export default function ImportPage() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { t, addPlace } = useApp();

  const [share, setShare] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setLoading(true);
    getShare(shareId)
      .then((data) => {
        setShare(data);
        setSelected(new Set(data.places.map((_, i) => i)));
      })
      .catch((e) => {
        console.error(e);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [shareId]);

  const toggleAll = () => {
    if (!share) return;
    if (selected.size === share.places.length) setSelected(new Set());
    else setSelected(new Set(share.places.map((_, i) => i)));
  };

  const toggleOne = (i) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  };

  const handleImport = async () => {
    if (!share) return;
    setImporting(true);
    try {
      const toImport = share.places.filter((_, i) => selected.has(i));
      for (const p of toImport) {
        await addPlace({
          name: p.name,
          category: p.category,
          lat: p.lat,
          lng: p.lng,
          radius_m: p.radius_m,
          notes: p.notes || "",
          enabled: true,
        });
      }
      setDone(true);
    } catch (e) {
      console.error(e);
      alert("Import failed");
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F7F5F0]">
        <Loader2 size={32} className="animate-spin text-[#E87A5D]" />
        <p className="text-sm text-[#5D6D7E]">{t.common.loading}</p>
      </div>
    );
  }

  if (error || !share) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 bg-[#F7F5F0] text-center">
        <div className="w-16 h-16 rounded-full bg-[#B85C5C]/10 flex items-center justify-center text-[#B85C5C]">
          <AlertTriangle size={28} />
        </div>
        <p className="text-[#1C2833] font-medium">{t.share.not_found}</p>
        <Link
          to="/"
          data-testid="back-home-link"
          className="px-5 py-2.5 rounded-xl bg-[#E87A5D] text-white font-medium hover:bg-[#D36A4F] transition flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          {t.share.back_home}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 bg-[#F7F5F0] text-center">
        <div className="w-20 h-20 rounded-full bg-[#7B9E87]/15 flex items-center justify-center text-[#7B9E87]">
          <Check size={36} strokeWidth={2.6} />
        </div>
        <h1 className="text-2xl font-bold text-[#1C2833]">{t.share.imported}</h1>
        <p className="text-sm text-[#5D6D7E] max-w-xs">
          {selected.size} {t.nav.places.toLowerCase()}
        </p>
        <button
          onClick={() => navigate("/places")}
          data-testid="go-to-places-btn"
          className="mt-2 px-6 py-3 rounded-xl bg-[#E87A5D] text-white font-semibold hover:bg-[#D36A4F] transition"
        >
          {t.share.go_to_places}
        </button>
      </div>
    );
  }

  const center =
    share.places.length > 0
      ? [share.places[0].lat, share.places[0].lng]
      : [24.7136, 46.6753];

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <header className="px-5 pt-5 pb-3 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5"
          data-testid="header-home-link"
        >
          <div className="w-9 h-9 rounded-2xl bg-[#2C3E50] flex items-center justify-center text-white shadow-md shadow-[#2C3E50]/20">
            <BellOff size={18} strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-bold text-[#1C2833] tracking-tight">
              {t.app_name}
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-[#5D6D7E] font-medium">
              {t.app_tagline}
            </p>
          </div>
        </Link>
        <span className="text-[11px] text-[#5D6D7E] flex items-center gap-1">
          <Eye size={12} /> {tFormat(t.share.views, { count: share.view_count })}
        </span>
      </header>

      <div className="px-5 mt-2 mb-4">
        <h2 className="text-2xl font-bold text-[#1C2833] tracking-tight">
          {t.share.import_title}
        </h2>
        <p className="text-sm text-[#5D6D7E] mt-1">
          {tFormat(t.share.import_subtitle, { count: share.places.length })}
        </p>
      </div>

      <div className="px-5">
        <div
          className="h-[40vh] w-full rounded-2xl overflow-hidden border border-black/5 mb-4"
          data-testid="import-map"
        >
          <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; OSM'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {share.places.map((p, i) => (
              <React.Fragment key={i}>
                <Circle
                  center={[p.lat, p.lng]}
                  radius={p.radius_m}
                  pathOptions={{
                    color: selected.has(i) ? "#E87A5D" : "#5D6D7E",
                    fillColor: selected.has(i) ? "#E87A5D" : "#5D6D7E",
                    fillOpacity: selected.has(i) ? 0.2 : 0.05,
                  }}
                />
                <Marker position={[p.lat, p.lng]} icon={placeIcon(p.category)}>
                  <Popup>{p.name}</Popup>
                </Marker>
              </React.Fragment>
            ))}
          </MapContainer>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#1C2833]">
            {selected.size} / {share.places.length}
          </h3>
          <button
            onClick={toggleAll}
            data-testid="toggle-all-btn"
            className="text-xs font-medium text-[#E87A5D] hover:underline"
          >
            {selected.size === share.places.length
              ? t.share.deselect_all
              : t.share.select_all}
          </button>
        </div>

        <div className="space-y-2 mb-24">
          {share.places.map((p, i) => {
            const cat = getCategory(p.category);
            const Icon = cat.icon;
            const isSel = selected.has(i);
            return (
              <button
                key={i}
                onClick={() => toggleOne(i)}
                data-testid={`import-place-${i}`}
                className={`w-full qz-card p-3.5 flex items-center gap-3 text-start transition-all ${
                  isSel ? "ring-2 ring-[#E87A5D]" : "opacity-70"
                }`}
              >
                <div
                  className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center"
                  style={{ background: `${cat.color}1a`, color: cat.color }}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#1C2833] truncate">{p.name}</p>
                  <p className="text-xs text-[#5D6D7E]">
                    {t.categories[p.category]} · {p.radius_m} {t.common.meters_short}
                  </p>
                </div>
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    isSel ? "bg-[#E87A5D] text-white" : "border-2 border-black/15"
                  }`}
                >
                  {isSel && <Check size={14} strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="fixed bottom-0 inset-x-0 qz-glass border-t border-black/5 px-5 py-3 pb-safe">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={handleImport}
              disabled={importing || selected.size === 0}
              data-testid="import-btn"
              className="w-full py-3.5 rounded-xl bg-[#E87A5D] text-white font-semibold hover:bg-[#D36A4F] disabled:opacity-50 active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              {importing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              {t.share.import_btn}{selected.size > 0 ? ` (${selected.size})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
