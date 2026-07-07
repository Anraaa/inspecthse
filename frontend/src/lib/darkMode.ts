import { create } from "zustand";

interface DarkModeState {
  isDark: boolean;
  toggle: () => void;
  setDark: (v: boolean) => void;
}

function loadDarkMode(): boolean {
  try {
    const saved = localStorage.getItem("dark_mode");
    if (saved !== null) return saved === "true";
  } catch { }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export const useDarkMode = create<DarkModeState>((set) => ({
  isDark: loadDarkMode(),
  toggle: () =>
    set((state) => {
      const next = !state.isDark;
      localStorage.setItem("dark_mode", String(next));
      document.documentElement.classList.toggle("dark", next);
      return { isDark: next };
    }),
  setDark: (v: boolean) => {
    localStorage.setItem("dark_mode", String(v));
    document.documentElement.classList.toggle("dark", v);
    set({ isDark: v });
  },
}));

export function initDarkMode() {
  const isDark = loadDarkMode();
  document.documentElement.classList.toggle("dark", isDark);
  return isDark;
}
