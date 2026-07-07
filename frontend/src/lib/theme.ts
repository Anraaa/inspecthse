import { create } from "zustand";

export interface ThemePreset {
  name: string;
  label: string;
  colors: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  gradient: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
}

export const themePresets: ThemePreset[] = [
  {
    name: "indigo",
    label: "Indigo",
    colors: {
      50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe",
      300: "#a5b4fc", 400: "#818cf8", 500: "#6366f1",
      600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81",
    },
    gradient: "from-indigo-500 via-violet-500 to-cyan-400",
    gradientFrom: "#6366f1", gradientVia: "#8b5cf6", gradientTo: "#22d3ee",
  },
  {
    name: "violet",
    label: "Violet",
    colors: {
      50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe",
      300: "#c4b5fd", 400: "#a78bfa", 500: "#8b5cf6",
      600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95",
    },
    gradient: "from-violet-500 via-purple-500 to-pink-400",
    gradientFrom: "#8b5cf6", gradientVia: "#a855f7", gradientTo: "#fb7185",
  },
  {
    name: "cyan",
    label: "Cyan",
    colors: {
      50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc",
      300: "#67e8f9", 400: "#22d3ee", 500: "#06b6d4",
      600: "#0891b2", 700: "#0e7490", 800: "#155e75", 900: "#164e63",
    },
    gradient: "from-cyan-500 via-teal-500 to-emerald-400",
    gradientFrom: "#06b6d4", gradientVia: "#14b8a6", gradientTo: "#34d399",
  },
  {
    name: "emerald",
    label: "Emerald",
    colors: {
      50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0",
      300: "#6ee7b7", 400: "#34d399", 500: "#10b981",
      600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b",
    },
    gradient: "from-emerald-500 via-teal-500 to-cyan-400",
    gradientFrom: "#10b981", gradientVia: "#14b8a6", gradientTo: "#22d3ee",
  },
  {
    name: "orange",
    label: "Orange",
    colors: {
      50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa",
      300: "#fdba74", 400: "#fb923c", 500: "#f97316",
      600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12",
    },
    gradient: "from-orange-500 via-amber-500 to-yellow-400",
    gradientFrom: "#f97316", gradientVia: "#f59e0b", gradientTo: "#facc15",
  },
  {
    name: "pink",
    label: "Pink",
    colors: {
      50: "#fdf2f8", 100: "#fce7f3", 200: "#fbcfe8",
      300: "#f9a8d4", 400: "#f472b6", 500: "#ec4899",
      600: "#db2777", 700: "#be185d", 800: "#9d174d", 900: "#831843",
    },
    gradient: "from-pink-500 via-rose-500 to-red-400",
    gradientFrom: "#ec4899", gradientVia: "#f43f5e", gradientTo: "#fb7185",
  },
];

interface ThemeState {
  theme: ThemePreset;
  setTheme: (name: string) => void;
}

function loadTheme(): ThemePreset {
  try {
    const saved = localStorage.getItem("app_theme");
    if (saved) {
      const found = themePresets.find((t) => t.name === saved);
      if (found) return found;
    }
  } catch { /* ignore */ }
  return themePresets[0];
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: loadTheme(),
  setTheme: (name: string) => {
    const found = themePresets.find((t) => t.name === name);
    if (found) {
      localStorage.setItem("app_theme", name);
      document.documentElement.setAttribute("data-theme", name);
      set({ theme: found });
    }
  },
}));

export function initTheme() {
  const saved = loadTheme();
  document.documentElement.setAttribute("data-theme", saved.name);
}
