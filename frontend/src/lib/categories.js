import {
  Moon,
  Cross,
  GraduationCap,
  Library as LibraryIcon,
  Activity,
  BookOpen,
  Briefcase,
  Home,
  MapPin,
} from "lucide-react";

export const CATEGORIES = [
  { key: "mosque", icon: Moon, color: "#7B9E87" },
  { key: "church", icon: Cross, color: "#7B9E87" },
  { key: "school", icon: GraduationCap, color: "#E87A5D" },
  { key: "university", icon: LibraryIcon, color: "#E87A5D" },
  { key: "hospital", icon: Activity, color: "#B85C5C" },
  { key: "library", icon: BookOpen, color: "#5D8AA8" },
  { key: "work", icon: Briefcase, color: "#2C3E50" },
  { key: "home", icon: Home, color: "#A88B5C" },
  { key: "other", icon: MapPin, color: "#5D6D7E" },
];

export function getCategory(key) {
  return CATEGORIES.find((c) => c.key === key) || CATEGORIES[CATEGORIES.length - 1];
}
