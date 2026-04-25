"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import {
  type ReaderFontSize,
  type ReaderTheme,
  readerThemeButtonClasses,
  readerThemeSurfaceClasses,
  useReaderSettings,
} from "@/shared/model/reader-settings";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

const fontSizeLabels: Record<ReaderFontSize, string> = {
  small: "Меньше",
  normal: "Обычный",
  large: "Больше",
};

const themeLabels: Record<ReaderTheme, string> = {
  light: "Светлая",
  sepia: "Сепия",
  dark: "Темная",
};

export function ReaderSettingsControl() {
  const { settings, setSettings } = useReaderSettings();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="plotty-reader-settings-control relative">
      <Button
        type="button"
        variant="secondary"
        className="min-h-10 px-3 text-sm"
        aria-expanded={isOpen}
        aria-controls="global-reader-settings-panel"
        onClick={() => setIsOpen((current) => !current)}
      >
        Aa
      </Button>

      {isOpen ? (
        <div
          id="global-reader-settings-panel"
          className={cn(
            "fixed right-4 top-[calc(4.75rem+env(safe-area-inset-top))] z-[70] w-[min(20rem,calc(100vw-2rem))] space-y-4 rounded-[20px] border p-4 shadow-[var(--plotty-shadow-soft)] backdrop-blur-xl lg:top-[calc(5.25rem+env(safe-area-inset-top))]",
            readerThemeSurfaceClasses[settings.theme],
          )}
        >
          <ReaderSettingGroup label="Размер текста">
            {(["small", "normal", "large"] as const).map((fontSize) => (
                  <ReaderSettingButton
                    key={fontSize}
                    theme={settings.theme}
                    isActive={settings.fontSize === fontSize}
                onClick={() => setSettings((current) => ({ ...current, fontSize }))}
              >
                {fontSizeLabels[fontSize]}
              </ReaderSettingButton>
            ))}
          </ReaderSettingGroup>

          <ReaderSettingGroup label="Интерлиньяж">
            {([1.4, 1.6, 1.8] as const).map((lineHeight) => (
                  <ReaderSettingButton
                    key={lineHeight}
                    theme={settings.theme}
                    isActive={settings.lineHeight === lineHeight}
                onClick={() => setSettings((current) => ({ ...current, lineHeight }))}
              >
                {lineHeight}
              </ReaderSettingButton>
            ))}
          </ReaderSettingGroup>

          <ReaderSettingGroup label="Тема">
            {(["light", "sepia", "dark"] as const).map((theme) => (
                  <ReaderSettingButton
                    key={theme}
                    theme={settings.theme}
                    isActive={settings.theme === theme}
                onClick={() => setSettings((current) => ({ ...current, theme }))}
              >
                {themeLabels[theme]}
              </ReaderSettingButton>
            ))}
          </ReaderSettingGroup>
        </div>
      ) : null}
    </div>
  );
}

function ReaderSettingGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--plotty-muted)]">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function ReaderSettingButton({
  isActive,
  theme,
  children,
  onClick,
}: {
  isActive: boolean;
  theme: ReaderTheme;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "plotty-reader-setting-button min-h-10 rounded-[14px] border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]",
        isActive && "plotty-reader-setting-button-active",
        isActive
          ? "!border-transparent !bg-[var(--plotty-accent)] !text-white"
          : "border-[var(--plotty-line)] bg-white/72 text-[var(--plotty-muted)] hover:bg-white hover:text-[var(--plotty-ink)]",
        !isActive && readerThemeButtonClasses[theme],
      )}
      aria-pressed={isActive}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
