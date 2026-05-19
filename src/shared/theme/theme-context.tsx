"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { IconButton } from "@/shared/ui/icon-button";

export type PlottyTheme = "light" | "dark";

const themeStorageKey = "plotty-theme";
const ThemeContext = createContext<{
  theme: PlottyTheme;
  toggleTheme: () => void;
}>({
  theme: "light",
  toggleTheme: () => undefined,
});

function isPlottyTheme(value: string | null): value is PlottyTheme {
  return value === "light" || value === "dark";
}

function getInitialTheme(): PlottyTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(themeStorageKey);

  if (isPlottyTheme(storedTheme)) {
    return storedTheme;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: PlottyTheme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<PlottyTheme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Включить светлую тему" : "Включить темную тему";

  return (
    <IconButton
      type="button"
      variant="ghost"
      className={className}
      aria-label={label}
      title={label}
      onClick={toggleTheme}
    >
      {isDark ? <Sun className="size-5" aria-hidden="true" /> : <Moon className="size-5" aria-hidden="true" />}
    </IconButton>
  );
}
