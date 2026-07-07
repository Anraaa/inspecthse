import { useThemeStore, themePresets } from "@/lib/theme";

export function ThemeSwitcher() {
  const { theme, setTheme } = useThemeStore();

  return (
    <div>
      <p className="text-xs text-gray-400 mb-2 px-1">Theme</p>
      <div className="flex flex-wrap gap-1.5 px-1">
        {themePresets.map((t) => (
          <button
            key={t.name}
            onClick={() => setTheme(t.name)}
            title={t.label}
            className={`w-6 h-6 rounded-full transition-all ${
              theme.name === t.name
                ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                : "hover:scale-110"
            }`}
            style={{ background: `linear-gradient(135deg, ${t.colors[500]}, ${t.colors[400]})` }}
          />
        ))}
      </div>
    </div>
  );
}
