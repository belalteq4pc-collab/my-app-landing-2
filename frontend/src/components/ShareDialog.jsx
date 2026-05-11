import React, { useState, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check, Link2, MessageCircle, Send, Twitter, Facebook, Mail, Share2, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { createShare } from "@/lib/api";
import { tFormat } from "@/lib/i18n";

/**
 * mode: "place" | "all" | "app"
 * place: when mode==="place", required
 */
export default function ShareDialog({ open, mode, place, onClose }) {
  const { t, places, userId } = useApp();
  const [shareUrl, setShareUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState("");

  const isAppShare = mode === "app";
  const isPackShare = mode === "all";

  const message = useMemo(() => {
    if (isAppShare) return t.share.message_app;
    if (isPackShare) return t.share.message_pack;
    return tFormat(t.share.message_place, { name: place?.name || "" });
  }, [mode, place, t, isAppShare, isPackShare]);

  // Generate share URL on open
  React.useEffect(() => {
    if (!open) return;
    setCopied(false);
    setError(null);
    setShareUrl("");
    setTitle("");

    if (isAppShare) {
      setShareUrl(window.location.origin);
      return;
    }

    const placesToShare =
      mode === "place" && place
        ? [place]
        : places.filter((p) => p.enabled !== false);

    if (placesToShare.length === 0) {
      setError("no_places");
      return;
    }

    setCreating(true);
    createShare({
      user_id: userId,
      title: "",
      places: placesToShare.map((p) => ({
        name: p.name,
        category: p.category,
        lat: p.lat,
        lng: p.lng,
        radius_m: p.radius_m,
        notes: p.notes || "",
      })),
    })
      .then((share) => {
        setShareUrl(`${window.location.origin}/s/${share.id}`);
      })
      .catch((e) => {
        console.error(e);
        setError("failed");
      })
      .finally(() => setCreating(false));
  }, [open, mode, place, places, userId, isAppShare]);

  if (!open) return null;

  const fullMessage = `${message}\n${shareUrl}`;
  const encMsg = encodeURIComponent(fullMessage);
  const encUrl = encodeURIComponent(shareUrl);

  const socialLinks = [
    {
      key: "whatsapp",
      label: t.share.whatsapp,
      icon: MessageCircle,
      color: "#25D366",
      href: `https://wa.me/?text=${encMsg}`,
    },
    {
      key: "telegram",
      label: t.share.telegram,
      icon: Send,
      color: "#0088cc",
      href: `https://t.me/share/url?url=${encUrl}&text=${encodeURIComponent(message)}`,
    },
    {
      key: "twitter",
      label: t.share.twitter,
      icon: Twitter,
      color: "#000000",
      href: `https://twitter.com/intent/tweet?text=${encMsg}`,
    },
    {
      key: "facebook",
      label: t.share.facebook,
      icon: Facebook,
      color: "#1877F2",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
    },
    {
      key: "email",
      label: t.share.email,
      icon: Mail,
      color: "#5D6D7E",
      href: `mailto:?subject=${encodeURIComponent("QuietZones")}&body=${encMsg}`,
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleNative = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: "QuietZones",
        text: message,
        url: shareUrl,
      });
    } catch (e) {
      // user cancelled - silent
    }
  };

  const headerTitle =
    mode === "place"
      ? t.share.share_place
      : isPackShare
      ? t.share.share_all
      : t.share.share_app;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm qz-fade-up"
      onClick={onClose}
      data-testid="share-dialog"
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white z-10 px-5 pt-5 pb-3 flex items-center justify-between border-b border-black/5">
          <h2 className="text-lg font-semibold text-[#1C2833]">{headerTitle}</h2>
          <button
            onClick={onClose}
            data-testid="close-share-dialog"
            className="p-2 rounded-full hover:bg-black/5 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {creating && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 size={28} className="animate-spin text-[#E87A5D]" />
              <p className="text-sm text-[#5D6D7E]">{t.common.loading}</p>
            </div>
          )}

          {error === "no_places" && (
            <div className="qz-card p-5 text-center">
              <p className="text-sm text-[#5D6D7E]">{t.home.no_places}</p>
            </div>
          )}

          {error === "failed" && (
            <div className="qz-card p-5 text-center text-[#B85C5C] text-sm">
              ⚠️ Could not create share link. Please try again.
            </div>
          )}

          {shareUrl && !creating && (
            <>
              {/* QR Code */}
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-[#F7F5F0] rounded-2xl border border-black/5">
                  <QRCodeSVG
                    value={shareUrl}
                    size={180}
                    level="M"
                    bgColor="#F7F5F0"
                    fgColor="#1C2833"
                    data-testid="share-qr-code"
                  />
                </div>
                <p className="text-xs text-[#5D6D7E]">{t.share.qr_hint}</p>
              </div>

              {/* Copy link */}
              <div>
                <div
                  className="flex items-center gap-2 bg-[#F7F5F0] rounded-xl p-2 border border-black/5"
                  data-testid="share-link-row"
                >
                  <Link2 size={16} className="text-[#5D6D7E] ms-2 shrink-0" />
                  <input
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-transparent text-sm text-[#1C2833] outline-none min-w-0 truncate"
                    onClick={(e) => e.target.select()}
                    data-testid="share-link-input"
                  />
                  <button
                    onClick={handleCopy}
                    data-testid="copy-link-btn"
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shrink-0 ${
                      copied
                        ? "bg-[#7B9E87] text-white"
                        : "bg-[#E87A5D] text-white hover:bg-[#D36A4F]"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check size={14} /> {t.share.copied}
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> {t.share.copy_link}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Social buttons */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#5D6D7E] mb-3">
                  {t.share.via}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {socialLinks.map((s) => {
                    const Icon = s.icon;
                    return (
                      <a
                        key={s.key}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`share-${s.key}`}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-black/10 hover:bg-black/5 active:scale-95 transition-all"
                      >
                        <span
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white"
                          style={{ background: s.color }}
                        >
                          <Icon size={16} />
                        </span>
                        <span className="text-[10px] font-medium text-[#5D6D7E]">
                          {s.label}
                        </span>
                      </a>
                    );
                  })}
                </div>

                {typeof navigator !== "undefined" && navigator.share && (
                  <button
                    onClick={handleNative}
                    data-testid="native-share-btn"
                    className="w-full mt-3 py-2.5 rounded-xl border border-dashed border-[#2C3E50]/30 text-[#2C3E50] hover:bg-black/5 transition text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Share2 size={16} />
                    {t.share.native}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
