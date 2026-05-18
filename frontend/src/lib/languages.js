// Language metadata: code, native name, direction, font family
export const LANGUAGES = [
  { code: "en", name: "English", dir: "ltr", font: "'Outfit', sans-serif", flag: "🇬🇧" },
  { code: "ar", name: "العربية", dir: "rtl", font: "'Tajawal', sans-serif", flag: "🇸🇦" },
  { code: "es", name: "Español", dir: "ltr", font: "'Outfit', sans-serif", flag: "🇪🇸" },
  { code: "fr", name: "Français", dir: "ltr", font: "'Outfit', sans-serif", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", dir: "ltr", font: "'Outfit', sans-serif", flag: "🇩🇪" },
  { code: "it", name: "Italiano", dir: "ltr", font: "'Outfit', sans-serif", flag: "🇮🇹" },
  { code: "pt", name: "Português", dir: "ltr", font: "'Outfit', sans-serif", flag: "🇵🇹" },
  { code: "ru", name: "Русский", dir: "ltr", font: "'Outfit', sans-serif", flag: "🇷🇺" },
  { code: "tr", name: "Türkçe", dir: "ltr", font: "'Outfit', sans-serif", flag: "🇹🇷" },
  { code: "id", name: "Indonesia", dir: "ltr", font: "'Outfit', sans-serif", flag: "🇮🇩" },
  { code: "zh", name: "中文", dir: "ltr", font: "'Noto Sans SC', sans-serif", flag: "🇨🇳" },
  { code: "ja", name: "日本語", dir: "ltr", font: "'Noto Sans JP', sans-serif", flag: "🇯🇵" },
  { code: "ko", name: "한국어", dir: "ltr", font: "'Noto Sans KR', sans-serif", flag: "🇰🇷" },
  { code: "hi", name: "हिन्दी", dir: "ltr", font: "'Noto Sans Devanagari', sans-serif", flag: "🇮🇳" },
  { code: "fa", name: "فارسی", dir: "rtl", font: "'Vazirmatn', sans-serif", flag: "🇮🇷" },
  { code: "ur", name: "اردو", dir: "rtl", font: "'Noto Nastaliq Urdu', serif", flag: "🇵🇰" },
];

export function getLanguage(code) {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}
