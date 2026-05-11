import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

const pinIcon = L.divIcon({
  className: "",
  html: `<div class="qz-place-marker" style="background:#E87A5D">
    <div style="width:14px;height:14px;background:#fff;border-radius:50%;"></div>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

function Recenterer({ pos, trigger }) {
  const map = useMap();
  useEffect(() => {
    if (!pos) return;
    map.setView(pos, Math.max(map.getZoom(), 15));
  }, [trigger, pos, map]);
  return null;
}

function Clicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick && onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

/**
 * Inline map picker for AddPlaceDialog.
 * Props:
 *   - lat, lng: current marker position
 *   - radius_m: optional preview circle
 *   - onPick({lat, lng}): callback when user taps map
 *   - flyTrigger: increment to recenter on programmatic change (e.g., search result)
 */
export default function MapPicker({ lat, lng, radius_m, onPick, flyTrigger, height = 200 }) {
  const hasInit = useRef(false);
  const pos = (Number.isFinite(lat) && Number.isFinite(lng)) ? [lat, lng] : null;
  const center = pos || [24.7136, 46.6753];

  useEffect(() => {
    if (pos) hasInit.current = true;
  }, [pos]);

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-black/10"
      style={{ height }}
      data-testid="map-picker"
    >
      <MapContainer
        center={center}
        zoom={pos ? 15 : 12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
        zoomControl={false}
      >
        <TileLayer
          attribution=""
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pos && (
          <>
            <Marker position={pos} icon={pinIcon} />
            {radius_m && (
              <Circle
                center={pos}
                radius={radius_m}
                pathOptions={{
                  color: "#E87A5D",
                  fillColor: "#E87A5D",
                  fillOpacity: 0.15,
                  weight: 2,
                }}
              />
            )}
          </>
        )}
        <Recenterer pos={pos} trigger={flyTrigger} />
        <Clicker onPick={onPick} />
      </MapContainer>
      <div className="absolute top-2 start-2 bg-white/90 backdrop-blur rounded-lg px-2.5 py-1 text-[11px] text-[#1C2833] font-medium shadow-sm pointer-events-none">
        Tap map to set location
      </div>
    </div>
  );
}
