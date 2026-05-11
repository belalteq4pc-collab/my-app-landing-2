import React from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { getCategory } from "@/lib/categories";
import { useApp } from "@/context/AppContext";

// Recenter helper
function Recenter({ center, fly = false }) {
  const map = useMap();
  React.useEffect(() => {
    if (!center) return;
    if (fly) map.flyTo(center, map.getZoom(), { duration: 0.8 });
    else map.setView(center, map.getZoom());
  }, [center, fly, map]);
  return null;
}

function PickHandler({ onPick }) {
  useMap().on("click", (e) => {
    if (onPick) onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
  });
  return null;
}

const userIcon = L.divIcon({
  className: "",
  html: '<div class="qz-user-marker"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function placeIcon(category) {
  const cat = getCategory(category);
  // We render the icon using a div + svg-less approach using a colored marker
  return L.divIcon({
    className: "",
    html: `<div class="qz-place-marker" style="background:${cat.color}">
      <div style="width:18px;height:18px;background:#fff;border-radius:50%;"></div>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

export default function MapView({ height = "60vh", onPickLocation, showZoomControl = true }) {
  const { places, location, insidePlaceIds } = useApp();

  const center = location
    ? [location.lat, location.lng]
    : places[0]
    ? [places[0].lat, places[0].lng]
    : [24.7136, 46.6753]; // Riyadh as fallback default

  return (
    <div
      style={{ height }}
      className="w-full overflow-hidden rounded-b-[2rem] relative"
      data-testid="map-view"
    >
      <MapContainer
        center={center}
        zoom={location ? 15 : 12}
        scrollWheelZoom
        zoomControl={showZoomControl}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {location && (
          <>
            <Marker position={[location.lat, location.lng]} icon={userIcon} />
            <Recenter center={[location.lat, location.lng]} fly />
          </>
        )}

        {places.map((p) => {
          const inside = insidePlaceIds.has(p.id);
          const cat = getCategory(p.category);
          return (
            <React.Fragment key={p.id}>
              <Circle
                center={[p.lat, p.lng]}
                radius={p.radius_m}
                pathOptions={{
                  color: inside ? "#7B9E87" : cat.color,
                  weight: inside ? 3 : 2,
                  fillColor: inside ? "#7B9E87" : cat.color,
                  fillOpacity: inside ? 0.25 : 0.12,
                  dashArray: p.enabled ? null : "6 6",
                }}
              />
              <Marker position={[p.lat, p.lng]} icon={placeIcon(p.category)}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-[#5D6D7E]">
                      {p.radius_m} m radius
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {onPickLocation && <PickHandler onPick={onPickLocation} />}
      </MapContainer>
    </div>
  );
}
