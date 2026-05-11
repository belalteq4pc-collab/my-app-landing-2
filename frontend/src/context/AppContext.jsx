import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { getUserId, listPlaces, createPlace as apiCreate, updatePlace as apiUpdate, deletePlace as apiDelete, listVisits, createVisit, clearVisits as apiClearVisits } from "@/lib/api";
import { distanceMeters } from "@/lib/geo";
import { getT, tFormat } from "@/lib/i18n";

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

const SETTINGS_KEY = "qz_settings_v1";
const defaultSettings = {
  lang: "en",
  defaultRadius: 100,
  notifications: true,
  sound: true,
  autoTrack: true,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function AppProvider({ children }) {
  const userId = getUserId();
  const [settings, setSettings] = useState(loadSettings);
  const [places, setPlaces] = useState([]);
  const [visits, setVisits] = useState([]);
  const [location, setLocation] = useState(null); // {lat, lng, accuracy}
  const [tracking, setTracking] = useState(false);
  const [locError, setLocError] = useState(null);
  const [insidePlaceIds, setInsidePlaceIds] = useState(new Set());
  const watchIdRef = useRef(null);
  const insideRef = useRef(new Set());

  // Apply language direction
  useEffect(() => {
    document.documentElement.dir = settings.lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = settings.lang;
  }, [settings.lang]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const t = getT(settings.lang);

  // Initial data load
  useEffect(() => {
    (async () => {
      try {
        const [p, v] = await Promise.all([listPlaces(userId), listVisits(userId)]);
        setPlaces(p);
        setVisits(v);
      } catch (e) {
        console.error("load failed", e);
      }
    })();
  }, [userId]);

  const reloadPlaces = useCallback(async () => {
    const p = await listPlaces(userId);
    setPlaces(p);
  }, [userId]);

  const reloadVisits = useCallback(async () => {
    const v = await listVisits(userId);
    setVisits(v);
  }, [userId]);

  // CRUD
  const addPlace = async (payload) => {
    const place = await apiCreate({ ...payload, user_id: userId });
    setPlaces((prev) => [place, ...prev]);
    return place;
  };
  const editPlace = async (id, payload) => {
    const place = await apiUpdate(id, payload);
    setPlaces((prev) => prev.map((p) => (p.id === id ? place : p)));
    return place;
  };
  const removePlace = async (id) => {
    await apiDelete(id);
    setPlaces((prev) => prev.filter((p) => p.id !== id));
    setVisits((prev) => prev.filter((v) => v.place_id !== id));
  };
  const clearAllHistory = async () => {
    await apiClearVisits(userId);
    setVisits([]);
  };

  // Notifications
  const requestNotifications = async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    const res = await Notification.requestPermission();
    return res === "granted";
  };

  const fireNotification = useCallback((title, body) => {
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body, icon: "/favicon.ico" });
      }
    } catch (e) {
      console.warn("notification error", e);
    }
    if (settings.sound) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        o.start();
        o.stop(ctx.currentTime + 0.5);
      } catch (e) {
        // ignore
      }
    }
  }, [settings.sound]);

  // Geofence detection on every location update
  useEffect(() => {
    if (!location || places.length === 0) return;
    const newInside = new Set();
    places.forEach((p) => {
      if (!p.enabled) return;
      const d = distanceMeters(location.lat, location.lng, p.lat, p.lng);
      if (d <= p.radius_m) newInside.add(p.id);
    });

    const prevInside = insideRef.current;
    // Enters
    newInside.forEach((id) => {
      if (!prevInside.has(id)) {
        const place = places.find((x) => x.id === id);
        if (!place) return;
        const catLabel = t.categories[place.category] || place.category;
        fireNotification(
          tFormat(t.notif.entered_title, { place: place.name }),
          tFormat(t.notif.entered_body, { category: catLabel })
        );
        createVisit({
          user_id: userId,
          place_id: place.id,
          place_name: place.name,
          category: place.category,
          event: "enter",
        }).then((v) => setVisits((prev) => [v, ...prev])).catch(() => {});
      }
    });
    // Exits
    prevInside.forEach((id) => {
      if (!newInside.has(id)) {
        const place = places.find((x) => x.id === id);
        if (!place) return;
        fireNotification(
          tFormat(t.notif.exited_title, { place: place.name }),
          t.notif.exited_body
        );
        createVisit({
          user_id: userId,
          place_id: place.id,
          place_name: place.name,
          category: place.category,
          event: "exit",
        }).then((v) => setVisits((prev) => [v, ...prev])).catch(() => {});
      }
    });

    insideRef.current = newInside;
    setInsidePlaceIds(newInside);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, places]);

  const startTracking = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocError("no_geo");
      return;
    }
    if (watchIdRef.current != null) return;
    setLocError(null);
    const wid = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLocError(null);
      },
      (err) => {
        console.warn("geo error", err);
        setLocError(err.code === 1 ? "denied" : "error");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    watchIdRef.current = wid;
    setTracking(true);
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  }, []);

  // Auto-start tracking if enabled
  useEffect(() => {
    if (settings.autoTrack) {
      startTracking();
    }
    return () => stopTracking();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentInsidePlace = places.find((p) => insidePlaceIds.has(p.id));

  const value = {
    userId,
    t,
    settings,
    setSettings,
    places,
    visits,
    location,
    locError,
    tracking,
    insidePlaceIds,
    currentInsidePlace,
    addPlace,
    editPlace,
    removePlace,
    reloadPlaces,
    reloadVisits,
    clearAllHistory,
    startTracking,
    stopTracking,
    requestNotifications,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
