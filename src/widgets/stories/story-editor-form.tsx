"use client";

import Link from "next/link";

import type { ChapterListItem, SpellcheckResult } from "@/entities/story/model/types";
import { routes } from "@/shared/config/routes";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Field, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

import { ShellCard } from "./plotty-shell";

export interface StoryEditorValues {
  chapterTitle: string;
  chapterContent: string;
}

export interface StoryEditorFormProps {
  values: StoryEditorValues;
  storyId?: string;
  storySlug?: string;
  chapterId?: string;
  chapterNumber?: number;
  chapters?: ChapterListItem[];
  spellcheckResult?: SpellcheckResult;
  aiStatusLabel?: string;
  isSaving?: boolean;
  isSpellchecking?: boolean;
  onChange: (next: StoryEditorValues) => void;
  onSave: () => void;
  onCreateNextChapter?: () => void;
  onDeleteChapter?: () => void;
  onSpellcheck: () => void;
}

export function StoryEditorForm({
  values,
  storyId,
  storySlug,
  chapterId,
  chapterNumber,
  chapters = [],
  spellcheckResult,
  aiStatusLabel,
  isSaving,
  isSpellchecking,
  onChange,
  onSave,
  onCreateNextChapter,
  onDeleteChapter,
  onSpellcheck,
}: StoryEditorFormProps) {
  const currentChapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId);
  const previousChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : undefined;
  const nextChapter =
    currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : undefined;

  function update<K extends keyof StoryEditorValues>(key: K, value: StoryEditorValues[K]) {
    onChange({
      ...values,
      [key]: value,
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <ShellCard
          title={`Глава ${chapterNumber ?? "—"}`}
          description="Редактируйте только текущую главу: текст, название, иллюстрацию и AI-инструменты."
        >
          <div className="grid gap-4">
            {storyId ? (
              <div className="flex flex-wrap gap-3">
                {previousChapter ? (
                  <ButtonLink href={routes.chapterEditor(storyId, previousChapter.id)} variant="secondary">
                    Предыдущая глава
                  </ButtonLink>
                ) : null}
                {nextChapter ? (
                  <ButtonLink href={routes.chapterEditor(storyId, nextChapter.id)} variant="secondary">
                    Следующая глава
                  </ButtonLink>
                ) : null}
                {storySlug ? (
                  <ButtonLink href={routes.story(storySlug)} variant="secondary">
                    К странице истории
                  </ButtonLink>
                ) : null}
              </div>
            ) : null}

            <Field>
              <FieldLabel htmlFor="chapter-title">Название главы</FieldLabel>
              <Input
                id="chapter-title"
                value={values.chapterTitle}
                onChange={(event) => update("chapterTitle", event.target.value)}
                placeholder="Название главы"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="chapter-content">Текст главы</FieldLabel>
              <Textarea
                id="chapter-content"
                value={values.chapterContent}
                onChange={(event) => update("chapterContent", event.target.value)}
                placeholder="Начните писать главу"
                className="min-h-[420px]"
              />
            </Field>

            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={onSave} disabled={isSaving}>
                {isSaving ? "Сохраняем..." : "Сохранить"}
              </Button>
              <Button onClick={onSpellcheck} disabled={!chapterId || isSpellchecking || !values.chapterContent.trim()}>
                {isSpellchecking ? "Проверяем..." : "Проверить орфографию"}
              </Button>
              <Button variant="secondary" onClick={onCreateNextChapter} disabled={isSaving || typeof onCreateNextChapter !== "function"}>
                Новая глава
              </Button>
            </div>
          </div>
        </ShellCard>
      </div>

      <div className="space-y-5">
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

        <ShellCard title="Навигация по главам" description="Быстрый переход между главами и действия над текущей главой.">
          <div className="space-y-3">
            {storySlug && chapters.length ? (
              <div className="space-y-2">
                {chapters.map((chapter) => (
                  <Link
                    key={chapter.id}
                    href={routes.chapterEditor(storyId ?? "", chapter.id)}
                    className={`block rounded-[18px] border px-3 py-3 text-sm font-semibold transition-[background-color,border-color,color] duration-150 ${
                      chapter.id === chapterId
                        ? "border-transparent bg-[var(--plotty-accent)] text-white"
                        : "border-[var(--plotty-line)] bg-white/70 text-[var(--plotty-muted)] hover:bg-white hover:text-[var(--plotty-ink)]"
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
                <Button variant="destructive" onClick={onDeleteChapter}>
                  Удалить главу
                </Button>
              ) : null}
            </div>
          </div>
        </ShellCard>
      </div>
    </div>
  );
}
