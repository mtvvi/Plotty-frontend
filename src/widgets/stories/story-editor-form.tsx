"use client";

import Link from "next/link";

import type {
  CanonCheckResult,
  ChapterListItem,
  LogicCheckResult,
  SpellcheckIssue,
  SpellcheckResult,
} from "@/entities/story/model/types";
import type { TextDiffPart } from "@/shared/lib/text-diff";
import { routes } from "@/shared/config/routes";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Field, FieldLabel } from "@/shared/ui/field";
import { HighlightedTextarea, type HighlightRange } from "@/shared/ui/highlighted-textarea";
import { Input } from "@/shared/ui/input";

import { ShellCard } from "./plotty-shell";

export interface StoryEditorValues {
  chapterTitle: string;
  chapterContent: string;
}

export interface PublicationDiff {
  title: TextDiffPart[];
  content: TextDiffPart[];
}

export interface StoryEditorFormProps {
  values: StoryEditorValues;
  storyId?: string;
  storySlug?: string;
  chapterId?: string;
  chapterNumber?: number;
  chapters?: ChapterListItem[];
  spellcheckResult?: SpellcheckResult;
  spellcheckHighlights?: HighlightRange[];
  aiStatusLabel?: string;
  logicCheckResult?: LogicCheckResult;
  logicStatusLabel?: string;
  canonCheckResult?: CanonCheckResult;
  canonStatusLabel?: string;
  isSaving?: boolean;
  isSpellchecking?: boolean;
  isLogicChecking?: boolean;
  isCanonChecking?: boolean;
  imagePanel?: React.ReactNode;
  onChange: (next: StoryEditorValues) => void;
  onSave: () => void;
  onPublish?: () => void;
  isPublishing?: boolean;
  hasPublishedVersion?: boolean;
  hasUnpublishedChanges?: boolean;
  publicationDiff?: PublicationDiff;
  onCreateNextChapter?: () => void;
  onDeleteChapter?: () => void;
  onSpellcheck: () => void;
  onLogicCheck: () => void;
  onCanonCheck: () => void;
  onApplySpellcheckIssue: (issue: SpellcheckIssue) => void;
}

export function StoryEditorForm({
  values,
  storyId,
  storySlug,
  chapterId,
  chapterNumber,
  chapters = [],
  spellcheckResult,
  spellcheckHighlights = [],
  aiStatusLabel,
  logicCheckResult,
  logicStatusLabel,
  canonCheckResult,
  canonStatusLabel,
  isSaving,
  isSpellchecking,
  isLogicChecking,
  isCanonChecking,
  imagePanel,
  onChange,
  onSave,
  onPublish,
  isPublishing,
  hasPublishedVersion,
  hasUnpublishedChanges,
  publicationDiff,
  onCreateNextChapter,
  onDeleteChapter,
  onSpellcheck,
  onLogicCheck,
  onCanonCheck,
  onApplySpellcheckIssue,
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
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <ShellCard
          title={`Глава ${chapterNumber ?? "—"}`}
          description="Редактируйте только текущую главу: текст, название, иллюстрацию и AI-инструменты."
        >
          <div className="grid gap-5">
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

            <div className="grid gap-4 rounded-[22px] border border-[rgba(41,38,34,0.08)] bg-[rgba(255,255,255,0.58)] p-4">
              {hasUnpublishedChanges ? (
                <div className="rounded-[18px] border border-[rgba(195,79,50,0.18)] bg-[var(--plotty-accent-wash)] px-4 py-3 text-sm leading-6 text-[var(--plotty-ink)]">
                  <span className="font-semibold">Есть неопубликованные изменения.</span>{" "}
                  Сохраненный черновик отличается от опубликованной версии главы.
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
                <HighlightedTextarea
                  id="chapter-content"
                  value={values.chapterContent}
                  onChange={(event) => update("chapterContent", event.target.value)}
                  placeholder="Начните писать главу"
                  className="min-h-[420px] bg-[rgba(255,255,255,0.9)]"
                  highlightRanges={spellcheckHighlights}
                />
              </Field>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-[var(--plotty-line)] pt-4">
              <Button variant="primary" onClick={onSave} disabled={isSaving}>
                {isSaving ? "Сохраняем..." : "Сохранить"}
              </Button>
              {typeof onPublish === "function" ? (
                <Button
                  variant="secondary"
                  onClick={onPublish}
                  disabled={
                    isPublishing ||
                    (hasPublishedVersion && !hasUnpublishedChanges) ||
                    !chapterId ||
                    !values.chapterContent.trim()
                  }
                >
                  {isPublishing
                    ? "Публикуем..."
                    : hasPublishedVersion && !hasUnpublishedChanges
                    ? "Опубликовано"
                    : hasPublishedVersion
                      ? "Опубликовать изменения"
                      : "Опубликовать"}
                </Button>
              ) : null}
              <Button variant="secondary" onClick={onSpellcheck} disabled={!chapterId || isSpellchecking || !values.chapterContent.trim()}>
                {isSpellchecking ? "Проверяем..." : "Проверить орфографию"}
              </Button>
              <Button variant="secondary" onClick={onLogicCheck} disabled={!chapterId || isLogicChecking || !values.chapterContent.trim()}>
                {isLogicChecking ? "Проверяем логику..." : "Проверить логику"}
              </Button>
              <Button variant="secondary" onClick={onCanonCheck} disabled={!chapterId || isCanonChecking || !values.chapterContent.trim()}>
                {isCanonChecking ? "Проверяем канон..." : "Проверить канон"}
              </Button>
              <Button variant="ghost" onClick={onCreateNextChapter} disabled={isSaving || typeof onCreateNextChapter !== "function"}>
                Новая глава
              </Button>
            </div>
          </div>
        </ShellCard>

        {publicationDiff && hasUnpublishedChanges ? (
          <ShellCard title="Изменения после публикации" description="Сравнение опубликованной версии и текущего черновика.">
            <div className="space-y-4">
              <DiffBlock title="Название" parts={publicationDiff.title} />
              <DiffBlock title="Текст главы" parts={publicationDiff.content} />
            </div>
          </ShellCard>
        ) : null}
      </div>

      <div className="space-y-5">
        {imagePanel}

        <div className="space-y-5">
          <ShellCard title="Орфография" description={aiStatusLabel ?? "Проверка запускается вручную после сохранения текста."}>
            {spellcheckResult ? (
              <div className="space-y-3">
                <p className="text-sm leading-6 text-[var(--plotty-muted)]">{spellcheckResult.summary}</p>
                <div className="space-y-2">
                  {spellcheckResult.items.length ? (
                    spellcheckResult.items.map((issue) => (
                      <div key={`${issue.startOffset}-${issue.endOffset}`} className="rounded-[18px] bg-[var(--plotty-panel)] p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <div className="text-sm font-semibold">{issue.fragmentText}</div>
                            <div className="text-sm leading-6 text-[var(--plotty-muted)]">{issue.message}</div>
                            <div className="text-sm text-[var(--plotty-accent)]">Предложение: {issue.suggestion}</div>
                          </div>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="shrink-0"
                            onClick={() => onApplySpellcheckIssue(issue)}
                          >
                            Исправить
                          </Button>
                        </div>
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

          <ShellCard
            title="Логика"
            description={
              logicStatusLabel ??
              "Сервис проверяет причинно-следственные связи и внутренние нестыковки сцены."
            }
          >
            {logicCheckResult ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--plotty-ink)]">{logicCheckResult.message}</p>
            ) : (
              <p className="text-sm leading-6 text-[var(--plotty-muted)]">
                Отправьте главу на проверку, и здесь появится список замечаний.
              </p>
            )}
          </ShellCard>

          <ShellCard
            title="Канон"
            description={
              canonStatusLabel ??
              "Сервис сверяет текст с каноном и правилами мира отдельно от логики главы."
            }
          >
            {canonCheckResult ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--plotty-ink)]">{canonCheckResult.message}</p>
            ) : (
              <p className="text-sm leading-6 text-[var(--plotty-muted)]">
                Отправьте главу на проверку, и здесь появится список замечаний.
              </p>
            )}
          </ShellCard>
        </div>

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
                        ? "border-[rgba(188,95,61,0.16)] bg-[rgba(188,95,61,0.08)] text-[var(--plotty-ink)]"
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

function DiffBlock({ title, parts }: { title: string; parts: TextDiffPart[] }) {
  return (
    <div className="space-y-2">
      <div className="plotty-kicker">{title}</div>
      <div className="max-h-72 overflow-y-auto rounded-[18px] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.72)] p-3 text-sm leading-7 text-[var(--plotty-ink)]">
        {parts.length ? (
          <p className="whitespace-pre-wrap">
            {parts.map((part, index) => (
              <DiffPart key={`${part.type}-${index}`} part={part} />
            ))}
          </p>
        ) : (
          <p className="text-[var(--plotty-muted)]">Изменений нет.</p>
        )}
      </div>
    </div>
  );
}

function DiffPart({ part }: { part: TextDiffPart }) {
  if (part.type === "added") {
    return <ins className="rounded-[4px] bg-[var(--plotty-olive-soft)] px-0.5 font-semibold no-underline">{part.value}</ins>;
  }

  if (part.type === "removed") {
    return <del className="rounded-[4px] bg-[var(--plotty-danger-soft)] px-0.5 text-[var(--plotty-danger)]">{part.value}</del>;
  }

  return <span>{part.value}</span>;
}
