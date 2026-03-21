"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import type {
  ChapterListItem,
  SpellcheckResult,
  StoryTag,
} from "@/entities/story/model/types";
import { storyTags } from "@/shared/config/story-tags";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

import { ShellCard } from "./plotty-shell";
import { StoryTagChip } from "./story-tag-chip";

export interface StoryEditorValues {
  storyTitle: string;
  storyDescription: string;
  storyExcerpt: string;
  selectedTagSlugs: string[];
  chapterTitle: string;
  chapterContent: string;
}

export interface StoryEditorFormProps {
  mode: "create" | "edit";
  values: StoryEditorValues;
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
    const nextTags = draftValues.selectedTagSlugs.includes(tag.slug)
      ? draftValues.selectedTagSlugs.filter((slug) => slug !== tag.slug)
      : [...draftValues.selectedTagSlugs, tag.slug];

    update("selectedTagSlugs", nextTags);
  }

  const currentChapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId);
  const previousChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : undefined;
  const nextChapter =
    currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : undefined;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <ShellCard title="История" description="Метаданные истории сохраняются отдельно от текста главы.">
          <div className="grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold">Название истории</span>
              <Input
                value={draftValues.storyTitle}
                onChange={(event) => update("storyTitle", event.target.value)}
                placeholder="Название истории"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">Короткий тизер</span>
              <Textarea
                value={draftValues.storyExcerpt}
                onChange={(event) => update("storyExcerpt", event.target.value)}
                placeholder="Короткое описание для каталога"
                className="min-h-28"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold">Полное описание</span>
              <Textarea
                value={draftValues.storyDescription}
                onChange={(event) => update("storyDescription", event.target.value)}
                placeholder="Описание истории"
                className="min-h-36"
              />
            </label>

            <div className="space-y-2">
              <div className="text-sm font-semibold">Теги</div>
              <div className="flex flex-wrap gap-2">
                {storyTags.map((tag) => (
                  <StoryTagChip
                    key={tag.id}
                    tag={tag}
                    active={draftValues.selectedTagSlugs.includes(tag.slug)}
                    onClick={() => toggleTag(tag)}
                  />
                ))}
              </div>
            </div>
          </div>
        </ShellCard>

        <ShellCard
          title={mode === "create" ? "Первая глава" : `Глава ${chapterNumber ?? "—"}`}
          description="Базовый редактор главы с отдельной отправкой текста на орфографическую проверку."
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
          <ShellCard title="Что будет дальше" description="После создания истории вы сразу попадёте в редактор первой главы.">
            <div className="space-y-3 text-sm leading-6 text-[var(--plotty-muted)]">
              <p>Сначала создается карточка истории с описанием и выбранными тегами.</p>
              <p>Затем автоматически создается первая глава и открывается маршрут редактирования.</p>
              <p>Орфографическую проверку можно запускать уже внутри редактора конкретной главы.</p>
            </div>
          </ShellCard>
        )}

        {mode === "edit" ? (
          <ShellCard title="Навигация по истории" description="Переход по главам и destructive actions.">
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
                      Глава {chapter.number}. {chapter.title}
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
