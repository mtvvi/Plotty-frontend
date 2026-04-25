"use client";

import type { CSSProperties, ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const readerSettingsStorageKey = "plotty-reader-settings";

export type ReaderFontSize = "small" | "normal" | "large";
export type ReaderTheme = "light" | "sepia" | "dark";

export interface ReaderSettings {
  fontSize: ReaderFontSize;
  lineHeight: number;
  theme: ReaderTheme;
}

export const defaultReaderSettings: ReaderSettings = {
  fontSize: "normal",
  lineHeight: 1.6,
  theme: "sepia",
};

export const readerFontSizeValues: Record<ReaderFontSize, string> = {
  small: "15px",
  normal: "16px",
  large: "18px",
};

export const readerThemePageClasses: Record<ReaderTheme, string> = {
  light: "bg-[rgba(255,255,255,0.74)] text-[var(--plotty-ink)]",
  sepia: "bg-[#fbf4e8] text-[var(--plotty-ink)]",
  dark: "bg-[#171513] text-[#f6eadb]",
};

export const readerThemeShellClasses: Record<ReaderTheme, string> = {
  light: "bg-[rgba(255,255,255,0.74)]",
  sepia: "bg-[#fbf4e8]",
  dark: "!bg-[#171513] ![background-image:none] [&_.plotty-frame]:!border-transparent [&_.plotty-frame]:!bg-[#171513] [&_.plotty-frame>header]:!border-[rgba(246,234,219,0.10)] [&_.plotty-frame>header]:!bg-[rgba(23,21,19,0.92)] [&_.plotty-logo]:!text-[#f6eadb] [&_.plotty-frame_header_nav>div]:!border-[rgba(246,234,219,0.10)] [&_.plotty-frame_header_nav>div]:!bg-[#26231f] [&_.plotty-frame_header_nav_a]:!text-[#f6eadb] [&_.plotty-frame_header_nav_a:hover]:!bg-[#302b26] [&_.plotty-frame_header_nav_a:hover]:!text-[#f6eadb] [&_.plotty-frame_header_a:not(.plotty-logo)]:!border-[rgba(246,234,219,0.12)] [&_.plotty-frame_header_a:not(.plotty-logo)]:!bg-[#26231f] [&_.plotty-frame_header_a:not(.plotty-logo)]:!text-[#f6eadb] [&_.plotty-frame_header_button]:!border-[rgba(246,234,219,0.12)] [&_.plotty-frame_header_button]:!bg-[#26231f] [&_.plotty-frame_header_button]:!text-[#f6eadb]",
};

export const readerThemeSurfaceClasses: Record<ReaderTheme, string> = {
  light: "border-[rgba(41,38,34,0.08)] bg-[rgba(255,255,255,0.9)] text-[var(--plotty-ink)]",
  sepia: "border-[rgba(87,67,43,0.12)] bg-[#fff8eb] text-[var(--plotty-ink)]",
  dark: "border-[rgba(246,234,219,0.18)] bg-[#26231f] text-[#f6eadb]",
};

export const readerThemeMutedClasses: Record<ReaderTheme, string> = {
  light: "text-[var(--plotty-muted)]",
  sepia: "text-[#79644d]",
  dark: "text-[#b8aa99]",
};

export const readerThemeButtonClasses: Record<ReaderTheme, string> = {
  light: "",
  sepia: "",
  dark: "!border-[rgba(246,234,219,0.14)] !bg-[#26231f] !text-[#f6eadb] hover:!border-[rgba(246,234,219,0.22)] hover:!bg-[#302b26]",
};

const readerSettingsHydrationScript = `
(() => {
  try {
    const raw = window.localStorage.getItem("plotty-reader-settings");
    if (!raw) return;

    const settings = JSON.parse(raw);
    const theme = settings.theme === "light" || settings.theme === "sepia" || settings.theme === "dark" ? settings.theme : "sepia";
    const fontSize = settings.fontSize === "small" ? "15px" : settings.fontSize === "large" ? "18px" : "16px";
    const lineHeight = [1.4, 1.6, 1.8].includes(settings.lineHeight) ? settings.lineHeight : 1.6;
    const scope = document.currentScript && document.currentScript.parentElement;

    if (!scope) return;

    scope.dataset.readerTheme = theme;
    scope.style.setProperty("--plotty-reader-font-size", fontSize);
    scope.style.setProperty("--plotty-reader-line-height", String(lineHeight));
  } catch {
  }
})();
`;

function parseReaderSettings(value: string | null): ReaderSettings {
  if (!value) {
    return defaultReaderSettings;
  }

  try {
    const parsed = JSON.parse(value) as Partial<ReaderSettings>;
    const fontSize: ReaderFontSize =
      parsed.fontSize === "small" || parsed.fontSize === "large" || parsed.fontSize === "normal"
        ? parsed.fontSize
        : defaultReaderSettings.fontSize;
    const lineHeight =
      typeof parsed.lineHeight === "number" && [1.4, 1.6, 1.8].includes(parsed.lineHeight)
        ? parsed.lineHeight
        : defaultReaderSettings.lineHeight;
    const theme: ReaderTheme =
      parsed.theme === "light" || parsed.theme === "dark" || parsed.theme === "sepia"
        ? parsed.theme
        : defaultReaderSettings.theme;

    return { fontSize, lineHeight, theme };
  } catch {
    return defaultReaderSettings;
  }
}

interface ReaderSettingsContextValue {
  settings: ReaderSettings;
  setSettings: (settings: ReaderSettings | ((current: ReaderSettings) => ReaderSettings)) => void;
}

const ReaderSettingsContext = createContext<ReaderSettingsContextValue | null>(null);

export function ReaderSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ReaderSettings>(defaultReaderSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      setSettings(parseReaderSettings(window.localStorage.getItem(readerSettingsStorageKey)));
    } catch {
      setSettings(defaultReaderSettings);
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(readerSettingsStorageKey, JSON.stringify(settings));
    } catch {
      // Keep settings in memory when browser storage is unavailable.
    }
  }, [isLoaded, settings]);

  const value = useMemo(() => ({ settings, setSettings }), [settings]);

  return (
    <ReaderSettingsContext.Provider value={value}>
      <div
        className="plotty-reader-settings-scope min-h-screen"
        data-reader-theme={settings.theme}
        suppressHydrationWarning
        style={{
          "--plotty-reader-font-size": readerFontSizeValues[settings.fontSize],
          "--plotty-reader-line-height": settings.lineHeight,
        } as CSSProperties}
      >
        <script dangerouslySetInnerHTML={{ __html: readerSettingsHydrationScript }} />
        {children}
      </div>
    </ReaderSettingsContext.Provider>
  );
}

export function useReaderSettings() {
  const context = useContext(ReaderSettingsContext);

  if (!context) {
    throw new Error("useReaderSettings must be used within ReaderSettingsProvider");
  }

  return context;
}
