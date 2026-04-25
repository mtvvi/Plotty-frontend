"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  myShelfQueryOptions,
  readerShelfLabels,
  readerShelfOptions,
} from "@/entities/library/api/library-api";
import type { ReaderShelf } from "@/entities/library/model/types";
import { EmptyState } from "@/shared/ui/empty-state";
import { TabButton } from "@/shared/ui/tabs";
import { RequireAuth } from "@/widgets/auth/require-auth";
import { PlottyAppMenu, PlottyPageShell, PlottySectionCard } from "@/widgets/layout/plotty-page-shell";
import { StoryCard } from "@/widgets/stories/story-card";

type LibraryTab = "all" | ReaderShelf;

export function ReaderLibraryScreen() {
  return (
    <RequireAuth>
      <ReaderLibraryContent />
    </RequireAuth>
  );
}

function ReaderLibraryContent() {
  const [activeTab, setActiveTab] = useState<LibraryTab>("all");
  const shelfQuery = useQuery(myShelfQueryOptions());
  const entries = shelfQuery.data?.items ?? [];
  const visibleEntries = useMemo(
    () => (activeTab === "all" ? entries : entries.filter((entry) => entry.shelf === activeTab)),
    [activeTab, entries],
  );

  return (
    <PlottyPageShell
      pageTitle="Библиотека"
      pageDescription="Ваши приватные статусы чтения. Они не отображаются в публичном профиле."
      menuContent={({ closeMenu }) => <PlottyAppMenu onNavigate={closeMenu} />}
    >
      <div className="space-y-5">
        <div className="plotty-segmented overflow-x-auto">
          <TabButton type="button" isActive={activeTab === "all"} onClick={() => setActiveTab("all")}>
            Все
          </TabButton>
          {readerShelfOptions.map((option) => (
            <TabButton
              key={option.value}
              type="button"
              isActive={activeTab === option.value}
              onClick={() => setActiveTab(option.value)}
            >
              {option.label}
            </TabButton>
          ))}
        </div>

        <PlottySectionCard
          title={activeTab === "all" ? "Все статусы" : readerShelfLabels[activeTab]}
          description={`${visibleEntries.length} ${getStoryLabel(visibleEntries.length)}`}
        >
          {shelfQuery.isLoading ? (
            <div className="space-y-3">
              <div className="h-44 rounded-[22px] bg-white/50" />
              <div className="h-44 rounded-[22px] bg-white/50" />
            </div>
          ) : visibleEntries.length ? (
            <div className="space-y-4">
              {visibleEntries.map((entry) => (
                <div key={`${entry.storyId}-${entry.shelf}`} className="space-y-2">
                  <div className="plotty-meta">{`Статус: ${readerShelfLabels[entry.shelf]} · обновлен ${new Date(entry.updatedAt).toLocaleDateString("ru-RU")}`}</div>
                  <StoryCard story={entry.story} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Здесь пока пусто" description="Добавьте статус чтения на странице истории или в каталоге." />
          )}
        </PlottySectionCard>
      </div>
    </PlottyPageShell>
  );
}

function getStoryLabel(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return "история";
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "истории";
  }

  return "историй";
}
