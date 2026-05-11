import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Bell, Volume2, MapPin, Globe, RotateCcw, Info, CheckCircle2 } from "lucide-react";

function Row({ icon: Icon, title, hint, children, testid }) {
  return (
    <div className="qz-card p-4 flex items-start gap-3" data-testid={testid}>
      <div className="w-10 h-10 shrink-0 rounded-xl bg-[#F7F5F0] flex items-center justify-center text-[#2C3E50]">
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-medium text-[#1C2833]">{title}</h3>
          {children}
        </div>
        {hint && <p className="text-xs text-[#5D6D7E] mt-1 leading-snug">{hint}</p>}
      </div>
    </div>
  );
}

function Toggle({ value, onChange, testid }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      data-testid={testid}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
        value ? "bg-[#7B9E87]" : "bg-black/15"
      }`}
    >
      <span
        className={`absolute top-0.5 ${
          value ? "start-[22px]" : "start-0.5"
        } w-5 h-5 bg-white rounded-full shadow transition-all`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { t, settings, setSettings, userId, requestNotifications, startTracking, stopTracking, tracking } = useApp();
  const [notifGranted, setNotifGranted] = useState(
    typeof Notification !== "undefined" ? Notification.permission === "granted" : false
  );

  const handleEnableNotif = async () => {
    const ok = await requestNotifications();
    setNotifGranted(ok);
    setSettings({ ...settings, notifications: ok });
  };

  return (
    <div className="px-5 pt-6 pb-28">
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-[#1C2833] tracking-tight">
          {t.settings.title}
        </h1>
      </header>

      <div className="space-y-3">
        <Row icon={Globe} title={t.settings.language} testid="settings-language">
          <div className="flex bg-[#F7F5F0] rounded-full p-1">
            {["en", "ar"].map((lng) => (
              <button
                key={lng}
                data-testid={`lang-${lng}`}
                onClick={() => setSettings({ ...settings, lang: lng })}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
                  settings.lang === lng
                    ? "bg-[#E87A5D] text-white shadow"
                    : "text-[#5D6D7E]"
                }`}
              >
                {t.common.languages[lng]}
              </button>
            ))}
          </div>
        </Row>

        <Row
          icon={Bell}
          title={t.settings.notifications}
          hint={t.settings.notifications_hint}
          testid="settings-notifications"
        >
          {notifGranted ? (
            <Toggle
              value={settings.notifications}
              onChange={(v) => setSettings({ ...settings, notifications: v })}
              testid="notifications-toggle"
            />
          ) : (
            <button
              onClick={handleEnableNotif}
              data-testid="enable-notifications-btn"
              className="text-xs font-semibold text-[#E87A5D] bg-[#E87A5D]/10 px-3 py-1.5 rounded-full hover:bg-[#E87A5D]/20 transition"
            >
              {t.actions.enable_notifications}
            </button>
          )}
        </Row>

        <Row icon={Volume2} title={t.settings.sound} testid="settings-sound">
          <Toggle
            value={settings.sound}
            onChange={(v) => setSettings({ ...settings, sound: v })}
            testid="sound-toggle"
          />
        </Row>

        <Row
          icon={MapPin}
          title={t.settings.auto_track}
          hint={tracking ? t.status.tracking_on : t.status.tracking_off}
          testid="settings-tracking"
        >
          <Toggle
            value={settings.autoTrack}
            onChange={(v) => {
              setSettings({ ...settings, autoTrack: v });
              if (v) startTracking();
              else stopTracking();
            }}
            testid="autotrack-toggle"
          />
        </Row>

        <div className="qz-card p-4" data-testid="settings-radius">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#F7F5F0] flex items-center justify-center text-[#2C3E50]">
              <MapPin size={18} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-[#1C2833]">{t.settings.default_radius}</h3>
              <p className="text-xs text-[#5D6D7E]">
                {settings.defaultRadius} {t.place.meters}
              </p>
            </div>
          </div>
          <input
            type="range"
            min={20}
            max={500}
            step={10}
            value={settings.defaultRadius}
            onChange={(e) =>
              setSettings({ ...settings, defaultRadius: parseInt(e.target.value, 10) })
            }
            className="w-full accent-[#E87A5D]"
            data-testid="default-radius-slider"
          />
        </div>

        <Row icon={Info} title={t.settings.about} hint={t.settings.about_text} testid="settings-about" />

        <Row icon={CheckCircle2} title={t.settings.device_id} testid="settings-device">
          <span className="text-[11px] font-mono text-[#5D6D7E] bg-black/5 px-2 py-1 rounded">
            {userId}
          </span>
        </Row>

        <button
          onClick={() => {
            if (confirm(t.settings.reset + "?")) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          data-testid="reset-data-btn"
          className="w-full qz-card p-4 flex items-center gap-3 text-[#B85C5C] hover:bg-[#B85C5C]/5 transition"
        >
          <div className="w-10 h-10 rounded-xl bg-[#B85C5C]/10 flex items-center justify-center">
            <RotateCcw size={18} />
          </div>
          <span className="font-medium">{t.settings.reset}</span>
        </button>
      </div>

      <p className="text-center text-[11px] text-[#5D6D7E] mt-8">
        QuietZones · {t.app_tagline}
      </p>
    </div>
  );
}
