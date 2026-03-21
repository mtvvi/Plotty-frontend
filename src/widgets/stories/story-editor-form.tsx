"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type { ChapterListItem, SpellcheckResult, StoryTag } from "@/entities/story/model/types";
import { routes } from "@/shared/config/routes";
import { getStoryTagCategoryLabel, groupStoryTags } from "@/shared/config/story-tags";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

import { ShellCard } from "./plotty-shell";
import { StoryTagChip } from "./story-tag-chip";

export interface StoryEditorValues {
  storyTitle: string;
  selectedTagIds: string[];
  chapterTitle: string;
  chapterContent: string;
}

export interface StoryEditorFormProps {
  mode: "create" | "edit";
  values: StoryEditorValues;
  availableTags: StoryTag[];
  storyId?: string;
  storySlug?: string;
  chapterId?: string;
  chapterNumber?: number;
  chapters?: ChapterListItem[];
  spellcheckResult?: SpellcheckResult;
  aiStatusLabel?: string;
  saveLabel?: string;
  isSaving?: boolean;
  isSpellchecking?: boolean;
  onChange: (next: StoryEditorValues) => void;
  onSave: () => void;
  onCreateNextChapter?: () => void;
  onDeleteChapter?: () => void;
  onDeleteStory?: () => void;
  onSpellcheck: () => void;
}

export function StoryEditorForm({
  mode,
  values,
  availableTags,
  storyId,
  storySlug,
  chapterId,
  chapterNumber,
  chapters = [],
  spellcheckResult,
  aiStatusLabel,
  saveLabel = "Сохранить",
  isSaving,
  isSpellchecking,
  onChange,
  onSave,
  onCreateNextChapter,
  onDeleteChapter,
  onDeleteStory,
  onSpellcheck,
}: StoryEditorFormProps) {
  const [draftValues, setDraftValues] = useState(values);

  useEffect(() => {
    setDraftValues(values);
  }, [values]);

  function update<K extends keyof StoryEditorValues>(key: K, value: StoryEditorValues[K]) {
    const next = { ...draftValues, [key]: value };
    setDraftValues(next);
    onChange(next);
  }

  function toggleTag(tag: StoryTag) {
    const nextTags = draftValues.selectedTagIds.includes(tag.id)
      ? draftValues.selectedTagIds.filter((id) => id !== tag.id)
      : [...draftValues.selectedTagIds, tag.id];

    update("selectedTagIds", nextTags);
  }

  const groupedTags = groupStoryTags(availableTags);
  const currentChapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId);
  const previousChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : undefined;
  const nextChapter =
    currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : undefined;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <ShellCard title="История" description="Бэкенд сейчас хранит название и набор тегов истории.">
          <div className="grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold">Название истории</span>
              <Input
                value={draftValues.storyTitle}
                onChange={(event) => update("storyTitle", event.target.value)}
                placeholder="Название истории"
              />
            </label>

            <div className="space-y-4">
              {Object.entries(groupedTags).map(([category, tags]) => (
                <div key={category} className="space-y-2">
                  <div className="text-sm font-semibold">{getStoryTagCategoryLabel(category)}</div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <StoryTagChip
                        key={tag.id}
                        tag={tag}
                        active={draftValues.selectedTagIds.includes(tag.id)}
                        onClick={() => toggleTag(tag)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ShellCard>

        <ShellCard
          title={mode === "create" ? "Первая глава" : `Глава ${chapterNumber ?? "—"}`}
          description="Текст главы хранится отдельно и редактируется своим запросом."
        >
          <div className="grid gap-4">
            {mode === "edit" && storyId ? (
              <div className="flex flex-wrap gap-3">
                {previousChapter ? (
                  <Link href={routes.chapterEditor(storyId, previousChapter.id)}>
                    <Button variant="secondary">Предыдущая глава</Button>
                  </Link>
                ) : null}
                {nextChapter ? (
                  <Link href={routes.chapterEditor(storyId, nextChapter.id)}>
                    <Button variant="secondary">Следующая глава</Button>
                  </Link>
                ) : null}
              </div>
            ) : null}

            <label className="space-y-2">
              <span className="text-sm font-semibold">Название главы</span>
              <Input
                value={draftValues.chapterTitle}
                onChange={(event) => update("chapterTitle", event.target.value)}
                placeholder="Название главы"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">Текст главы</span>
              <Textarea
                value={draftValues.chapterContent}
                onChange={(event) => update("chapterContent", event.target.value)}
                placeholder="Начните писать главу"
                className="min-h-[420px]"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={onSave} disabled={isSaving}>
                {isSaving ? "Сохраняем..." : saveLabel}
              </Button>
              {mode === "edit" ? (
                <Button
                  onClick={onSpellcheck}
                  disabled={!chapterId || isSpellchecking || !draftValues.chapterContent.trim()}
                >
                  {isSpellchecking ? "Проверяем..." : "Проверить орфографию"}
                </Button>
              ) : null}
              {mode === "edit" ? (
                <Button
                  variant="soft"
                  onClick={onCreateNextChapter}
                  disabled={isSaving || typeof onCreateNextChapter !== "function"}
                >
                  Новая глава
                </Button>
              ) : null}
            </div>
          </div>
        </ShellCard>
      </div>

      <div className="space-y-5">
        {mode === "edit" ? (
          <ShellCard title="Орфография" description={aiStatusLabel ?? "Проверка запускается вручную после сохранения текста."}>
            {spellcheckResult ? (
              <div className="space-y-3">
                <p className="text-sm leading-6 text-[var(--plotty-muted)]">{spellcheckResult.summary}</p>
                <div className="space-y-2">
                  {spellcheckResult.items.length ? (
                    spellcheckResult.items.map((issue) => (
                      <div key={`${issue.startOffset}-${issue.endOffset}`} className="rounded-[18px] bg-[var(--plotty-panel)] p-3">
                        <div className="text-sm font-semibold">{issue.fragmentText}</div>
                        <div className="text-sm leading-6 text-[var(--plotty-muted)]">{issue.message}</div>
                        <div className="text-sm text-[var(--plotty-accent)]">Предложение: {issue.suggestion}</div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] bg-[var(--plotty-panel)] p-3 text-sm text-[var(--plotty-muted)]">
                      Ошибок не найдено.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--plotty-muted)]">
                Отправьте главу на проверку, и здесь появится список замечаний.
              </p>
            )}
          </ShellCard>
        ) : (
          <ShellCard title="Что будет дальше" description="После создания истории откроется маршрут редактирования главы.">
            <div className="space-y-3 text-sm leading-6 text-[var(--plotty-muted)]">
              <p>Сначала создается история с названием и выбранными тегами.</p>
              <p>Сразу после этого создается первая глава с введенным текстом.</p>
              <p>Орфографическую проверку и генерацию картинки можно запускать уже из редактора главы.</p>
            </div>
          </ShellCard>
        )}

        {mode === "edit" ? (
          <ShellCard title="Навигация по истории" description="Переход между главами и удаление.">
            <div className="space-y-3">
              {storySlug && chapters.length ? (
                <div className="space-y-2">
                  {chapters.map((chapter) => (
                    <Link
                      key={chapter.id}
                      href={routes.chapterEditor(storyId ?? "", chapter.id)}
                      className={`block rounded-[18px] border px-3 py-3 text-sm ${
                        chapter.id === chapterId
                          ? "border-[var(--plotty-accent)] bg-[var(--plotty-accent-soft)] text-[var(--plotty-ink)]"
                          : "border-[var(--plotty-line)] bg-white/70 text-[var(--plotty-muted)]"
                      }`}
                    >
                      Глава {chapter.number ?? "—"}. {chapter.title}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--plotty-muted)]">Главы появятся после первого сохранения.</p>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                {onDeleteChapter ? (
                  <Button variant="ghost" onClick={onDeleteChapter}>
                    Удалить главу
                  </Button>
                ) : null}
                {onDeleteStory ? (
                  <Button variant="ghost" onClick={onDeleteStory}>
                    Удалить историю
                  </Button>
                ) : null}
              </div>
            </div>
          </ShellCard>
        ) : null}
      </div>
    </div>
  );
}
