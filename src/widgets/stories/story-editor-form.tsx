"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

import type {
  CanonCheckResult,
  ChapterListItem,
  LogicCheckResult,
  SpellcheckIssue,
  SpellcheckResult,
} from "@/entities/story/model/types";
import { AI_CREDIT_COSTS } from "@/entities/credits/model/credit-utils";
import type { TextDiffPart } from "@/shared/lib/text-diff";
import { routes } from "@/shared/config/routes";
import { Button, ButtonLink, type ButtonProps } from "@/shared/ui/button";
import { Surface } from "@/shared/ui/card";
import { Field, FieldLabel } from "@/shared/ui/field";
import { HighlightedTextarea, type HighlightRange } from "@/shared/ui/highlighted-textarea";
import { Input } from "@/shared/ui/input";
import { AnimatedList, AsyncJobStatus, type AsyncJobStatusValue } from "@/shared/ui/motion";
import { PopoverContent, type PopoverPosition } from "@/shared/ui/popover";
import { CreditCostBadge } from "@/widgets/credits/credit-cost-badge";

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
  spellcheckHighlights?: HighlightRange<SpellcheckIssue>[];
  aiStatusLabel?: string;
  spellcheckStatus?: AsyncJobStatusValue;
  spellcheckStatusError?: string;
  logicCheckResult?: LogicCheckResult;
  logicStatusLabel?: string;
  logicCheckStatus?: AsyncJobStatusValue;
  logicStatusError?: string;
  logicDisabledReason?: string;
  canonCheckResult?: CanonCheckResult;
  canonStatusLabel?: string;
  canonCheckStatus?: AsyncJobStatusValue;
  canonStatusError?: string;
  canonDisabledReason?: string;
  creditBalance?: number;
  creditError?: string;
  saveStatusMessage?: string;
  isSaving?: boolean;
  isSpellchecking?: boolean;
  isLogicChecking?: boolean;
  isCanonChecking?: boolean;
  imagePanel?: ReactNode;
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
  onApplySpellcheckIssue: (issue: SpellcheckIssue) => boolean;
  onDismissSpellcheckIssue: (issue: SpellcheckIssue) => void;
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
  spellcheckStatus = "idle",
  spellcheckStatusError,
  logicCheckResult,
  logicStatusLabel,
  logicCheckStatus = "idle",
  logicStatusError,
  logicDisabledReason,
  canonCheckResult,
  canonStatusLabel,
  canonCheckStatus = "idle",
  canonStatusError,
  canonDisabledReason,
  creditBalance,
  creditError,
  saveStatusMessage,
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
  onDismissSpellcheckIssue,
}: StoryEditorFormProps) {
  const currentChapterIndex = chapters.findIndex((chapter) => chapter.id === chapterId);
  const previousChapter = currentChapterIndex > 0 ? chapters[currentChapterIndex - 1] : undefined;
  const nextChapter =
    currentChapterIndex >= 0 && currentChapterIndex < chapters.length - 1 ? chapters[currentChapterIndex + 1] : undefined;
  const popoverContentRef = useRef<HTMLDivElement | null>(null);
  const suppressedSpellcheckIssueIdRef = useRef("");
  const [activeSpellcheckIssueId, setActiveSpellcheckIssueId] = useState("");
  const [highlightScrollKey, setHighlightScrollKey] = useState(0);
  const [unresolvedSpellcheckIssueId, setUnresolvedSpellcheckIssueId] = useState("");
  const [suppressedSpellcheckIssueId, setSuppressedSpellcheckIssueId] = useState("");
  const [spellcheckPopover, setSpellcheckPopover] = useState<{
    issue: SpellcheckIssue;
    position: PopoverPosition;
  } | null>(null);
  const isMobileCorrectionOverlay = useCorrectionOverlayMode();
  const shouldOfferTopUp = typeof creditBalance === "number" && creditBalance < AI_CREDIT_COSTS.imageGeneration;
  const isSpellcheckFailed = spellcheckStatus === "failed";
  const isLogicCheckFailed = logicCheckStatus === "failed";
  const isCanonCheckFailed = canonCheckStatus === "failed";
  const spellcheckHighlightById = useMemo(() => {
    const map = new Map<string, HighlightRange<SpellcheckIssue>>();

    spellcheckHighlights.forEach((range) => {
      if (range.id) {
        map.set(range.id, range);
      }
    });

    return map;
  }, [spellcheckHighlights]);

  const suppressSpellcheckIssue = useCallback((issueId: string) => {
    suppressedSpellcheckIssueIdRef.current = issueId;
    setSuppressedSpellcheckIssueId(issueId);
  }, []);

  const closeSpellcheckPopover = useCallback((issueId?: string) => {
    const nextSuppressedIssueId = issueId ?? activeSpellcheckIssueId;

    if (nextSuppressedIssueId) {
      suppressSpellcheckIssue(nextSuppressedIssueId);
    }

    setSpellcheckPopover(null);
    setActiveSpellcheckIssueId("");
  }, [activeSpellcheckIssueId, suppressSpellcheckIssue]);

  const showSpellcheckPopover = useCallback(
    (range: HighlightRange<SpellcheckIssue>, anchorRect: DOMRect) => {
      if (!range.id || !range.data) {
        return;
      }

      setActiveSpellcheckIssueId(range.id);
      setUnresolvedSpellcheckIssueId("");
      setSpellcheckPopover({
        issue: range.data,
        position: getIssuePopoverPosition(anchorRect),
      });
    },
    [],
  );

  const handleActiveHighlightAnchorChange = useCallback(
    (range: HighlightRange<SpellcheckIssue>, anchorRect: DOMRect) => {
      if (range.id && (range.id === suppressedSpellcheckIssueId || range.id === suppressedSpellcheckIssueIdRef.current)) {
        return;
      }

      showSpellcheckPopover(range, anchorRect);
    },
    [showSpellcheckPopover, suppressedSpellcheckIssueId],
  );

  const handleHighlightClick = useCallback(
    (range: HighlightRange<SpellcheckIssue>, anchorRect: DOMRect) => {
      suppressedSpellcheckIssueIdRef.current = "";
      setSuppressedSpellcheckIssueId("");
      showSpellcheckPopover(range, anchorRect);
    },
    [showSpellcheckPopover],
  );

  const handleActiveHighlightHidden = closeSpellcheckPopover;

  function update<K extends keyof StoryEditorValues>(key: K, value: StoryEditorValues[K]) {
    onChange({
      ...values,
      [key]: value,
    });
  }

  function openSpellcheckIssue(issue: SpellcheckIssue) {
    const issueId = getSpellcheckIssueKey(issue);
    const highlight = spellcheckHighlightById.get(issueId);

    if (!highlight) {
      setSpellcheckPopover(null);
      setActiveSpellcheckIssueId("");
      setUnresolvedSpellcheckIssueId(issueId);
      return;
    }

    suppressedSpellcheckIssueIdRef.current = "";
    setSuppressedSpellcheckIssueId("");
    setActiveSpellcheckIssueId(issueId);
    setUnresolvedSpellcheckIssueId("");
    setHighlightScrollKey((current) => current + 1);
  }

  function applySpellcheckIssue(issue: SpellcheckIssue) {
    const applied = onApplySpellcheckIssue(issue);

    if (!applied) {
      setSpellcheckPopover(null);
      setUnresolvedSpellcheckIssueId(getSpellcheckIssueKey(issue));
      return;
    }

    closeSpellcheckPopover();
    setUnresolvedSpellcheckIssueId("");
  }

  function dismissSpellcheckIssue(issue: SpellcheckIssue) {
    onDismissSpellcheckIssue(issue);
    closeSpellcheckPopover();
    setUnresolvedSpellcheckIssueId("");
  }

  useEffect(() => {
    if (activeSpellcheckIssueId && !spellcheckHighlightById.has(activeSpellcheckIssueId)) {
      setActiveSpellcheckIssueId("");
      setSpellcheckPopover(null);
    }
  }, [activeSpellcheckIssueId, spellcheckHighlightById]);

  useEffect(() => {
    if (!spellcheckPopover) {
      return;
    }

    const spellcheckIssueId = getSpellcheckIssueKey(spellcheckPopover.issue);

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (!popoverContentRef.current?.contains(target)) {
        closeSpellcheckPopover(spellcheckIssueId);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeSpellcheckPopover(spellcheckIssueId);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [closeSpellcheckPopover, spellcheckPopover]);

  return (
    <div className="plotty-stagger grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="plotty-stagger-item min-w-0 space-y-5">
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

            <div className="grid gap-4 rounded-[22px] border border-[var(--plotty-line)] bg-[var(--plotty-surface-muted)] p-4">
              {hasUnpublishedChanges ? (
                <div className="plotty-panel-enter rounded-[18px] border border-[rgba(195,79,50,0.18)] bg-[var(--plotty-accent-wash)] px-4 py-3 text-sm leading-6 text-[var(--plotty-ink)]">
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
                  className="min-h-[420px] bg-[var(--plotty-surface-strong)]"
                  activeHighlightId={activeSpellcheckIssueId}
                  activeHighlightScrollKey={highlightScrollKey}
                  highlightRanges={spellcheckHighlights}
                  onActiveHighlightAnchorChange={handleActiveHighlightAnchorChange}
                  onActiveHighlightHidden={handleActiveHighlightHidden}
                  onHighlightClick={handleHighlightClick}
                />
              </Field>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-[var(--plotty-line)] pt-4">
              <Button variant="primary" onClick={onSave} disabled={isSaving}>
                {isSaving ? "Сохраняем..." : "Сохранить черновик"}
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
              <CreditCostButton
                cost={AI_CREDIT_COSTS.spellcheck}
                showCostBadge={false}
                variant="secondary"
                onClick={onSpellcheck}
                disabled={!chapterId || isSpellchecking || !values.chapterContent.trim()}
              >
                {isSpellchecking ? "Проверяем..." : isSpellcheckFailed ? "Повторить орфографию" : "Проверить орфографию"}
              </CreditCostButton>
              <CreditCostButton
                cost={AI_CREDIT_COSTS.logicCheck}
                variant="secondary"
                onClick={onLogicCheck}
                disabled={!chapterId || isLogicChecking || !values.chapterContent.trim() || Boolean(logicDisabledReason)}
                title={logicDisabledReason}
              >
                {isLogicChecking ? "Проверяем логику..." : isLogicCheckFailed ? "Повторить логику" : "Проверить логику"}
              </CreditCostButton>
              <CreditCostButton
                cost={AI_CREDIT_COSTS.canonCheck}
                variant="secondary"
                onClick={onCanonCheck}
                disabled={!chapterId || isCanonChecking || !values.chapterContent.trim() || Boolean(canonDisabledReason)}
                title={canonDisabledReason}
              >
                {isCanonChecking ? "Проверяем канон..." : isCanonCheckFailed ? "Повторить канон" : "Проверить канон"}
              </CreditCostButton>
              <Button variant="ghost" onClick={onCreateNextChapter} disabled={isSaving || typeof onCreateNextChapter !== "function"}>
                Новая глава
              </Button>
            </div>
            {saveStatusMessage ? (
              <Surface role="status" variant="subtle" className="px-3 py-2 text-sm font-semibold text-[var(--plotty-olive)]">
                {saveStatusMessage}
              </Surface>
            ) : null}
            <div className="space-y-3">
              {logicDisabledReason || canonDisabledReason ? (
                <Surface variant="subtle" className="space-y-1 px-3 py-2 text-sm leading-5 text-[var(--plotty-muted)]">
                  {logicDisabledReason ? <p>{logicDisabledReason}</p> : null}
                  {canonDisabledReason ? <p>{canonDisabledReason}</p> : null}
                </Surface>
              ) : null}
              {shouldOfferTopUp && !creditError ? (
                <ButtonLink href={routes.credits} variant="ghost" size="sm">
                  Пополнить баланс
                </ButtonLink>
              ) : null}
              {creditError ? (
                <Surface variant="subtle" className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-[var(--plotty-danger)]">{creditError}</p>
                  <ButtonLink href={routes.credits} variant="secondary" size="sm">
                    Пополнить
                  </ButtonLink>
                </Surface>
              ) : null}
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

      <div className="plotty-stagger-item min-w-0 space-y-5">
        {imagePanel}

        <div className="space-y-5">
          <ShellCard title="Орфография" description={aiStatusLabel ?? "Проверка запускается вручную после сохранения текста."}>
            <AsyncJobStatus
              compact
              status={spellcheckStatus}
              label={spellcheckStatus === "completed" ? "Проверка орфографии готова" : "Проверяем орфографию"}
              description="Ищем спорные фрагменты и готовим подсказки."
              error={spellcheckStatusError}
              className="mb-3"
            />
            {spellcheckResult ? (
              <div className="space-y-3">
                <p className="text-sm leading-6 text-[var(--plotty-muted)]">{spellcheckResult.summary}</p>
                <div className="min-w-0 max-h-[32rem] space-y-2 overflow-y-auto pr-1">
                  {spellcheckResult.items.length ? (
                    <AnimatedList
                      items={spellcheckResult.items}
                      getKey={getSpellcheckIssueKey}
                      className="space-y-2"
                      renderItem={(issue) => {
                        const issueId = getSpellcheckIssueKey(issue);
                        const isUnresolved = unresolvedSpellcheckIssueId === issueId;
                        const isActive = activeSpellcheckIssueId === issueId;

                        return (
                          <Surface
                            variant="listItem"
                            className={`plotty-lift-panel min-w-0 p-3 transition-[border-color,background-color] duration-150 ${
                              isActive
                                ? "border-[rgba(195,79,50,0.28)] bg-[var(--plotty-accent-wash)]"
                                : ""
                            }`}
                          >
                            <button
                              type="button"
                              className="block min-w-0 w-full text-left"
                              onClick={() => openSpellcheckIssue(issue)}
                            >
                              <div className="min-w-0 space-y-1">
                                <div className="break-words text-sm leading-5 text-[var(--plotty-muted)]">{issue.message}</div>
                                <SpellcheckPreview issue={issue} />
                                {isUnresolved ? (
                                  <div className="text-xs font-semibold text-[var(--plotty-danger)]">
                                    Фрагмент не найден в текущем тексте. Запустите проверку заново.
                                  </div>
                                ) : null}
                              </div>
                            </button>
                            <div className="pt-2">
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => applySpellcheckIssue(issue)}
                                >
                                  Исправить
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  aria-label="Оставить как есть"
                                  onClick={() => dismissSpellcheckIssue(issue)}
                                >
                                  Как есть
                                </Button>
                              </div>
                            </div>
                          </Surface>
                        );
                      }}
                    />
                  ) : (
                    <Surface variant="listItem" className="p-3 text-sm text-[var(--plotty-muted)]">
                      Ошибок не найдено.
                    </Surface>
                  )}
                </div>
                <SpellcheckIssueOverlay
                  contentRef={popoverContentRef}
                  isMobile={isMobileCorrectionOverlay}
                  onApply={applySpellcheckIssue}
                  onDismiss={dismissSpellcheckIssue}
                  onClose={closeSpellcheckPopover}
                  popover={spellcheckPopover}
                />
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
              "ИИ проверяет причинно-следственные связи, мотивацию персонажей и внутренние нестыковки сцены."
            }
          >
            <AsyncJobStatus
              compact
              status={logicCheckStatus}
              label={logicCheckStatus === "completed" ? "Проверка логики готова" : "Проверяем логику"}
              description="Сверяем причинность, мотивацию и внутренние противоречия."
              error={logicStatusError}
              className="mb-3"
            />
            {logicCheckResult ? (
              <p className="plotty-motion-tab-panel whitespace-pre-wrap text-sm leading-6 text-[var(--plotty-ink)]">{logicCheckResult.message}</p>
            ) : (
              <p className="text-sm leading-6 text-[var(--plotty-muted)]">
                Отправьте главу на проверку, и здесь появится список замечаний.
              </p>
            )}
          </ShellCard>

          <ShellCard
            title="Канон"
            description={
              canonStatusLabel ||
              "ИИ сверяет текст с каноном и правилами мира."
            }
          >
            <AsyncJobStatus
              compact
              status={canonCheckStatus}
              label={canonCheckStatus === "completed" ? "Проверка канона готова" : "Проверяем канон"}
              description="Сравниваем сцену с правилами мира и уже опубликованным каноном."
              error={canonStatusError}
              className="mb-3"
            />
            {canonCheckResult ? (
              <p className="plotty-motion-tab-panel whitespace-pre-wrap text-sm leading-6 text-[var(--plotty-ink)]">{canonCheckResult.message}</p>
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
              <div className="plotty-scroll-panel plotty-editor-chapter-nav-list space-y-2">
                {chapters.map((chapter) => (
                  <Link
                    key={chapter.id}
                    href={routes.chapterEditor(storyId ?? "", chapter.id)}
                    className={`block rounded-[18px] border px-3 py-3 text-sm font-semibold transition-[background-color,border-color,color,transform] duration-150 hover:translate-x-0.5 ${
                      chapter.id === chapterId
                        ? "border-[rgba(188,95,61,0.16)] bg-[rgba(188,95,61,0.08)] text-[var(--plotty-ink)]"
                        : "border-[var(--plotty-line)] bg-[var(--plotty-surface-soft)] text-[var(--plotty-muted)] hover:bg-[var(--plotty-surface-hover)] hover:text-[var(--plotty-ink)]"
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

function CreditCostButton({
  cost,
  children,
  className,
  showCostBadge = true,
  ...props
}: ButtonProps & { cost: number; showCostBadge?: boolean }) {
  return (
    <span className="relative inline-flex">
      <Button className={className} {...props}>
        {children}
      </Button>
      {showCostBadge ? <CreditCostBadge cost={cost} /> : null}
    </span>
  );
}

function DiffBlock({ title, parts }: { title: string; parts: TextDiffPart[] }) {
  return (
    <div className="space-y-2">
      <div className="plotty-kicker">{title}</div>
      <div className="max-h-72 overflow-y-auto rounded-[18px] border border-[var(--plotty-line)] bg-[var(--plotty-surface-soft)] p-3 text-sm leading-7 text-[var(--plotty-ink)]">
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

function getSpellcheckIssueKey(issue: SpellcheckIssue) {
  return `${issue.startOffset}-${issue.endOffset}-${issue.fragmentText}-${issue.suggestion}`;
}

function SpellcheckPreview({ issue }: { issue: SpellcheckIssue }) {
  return (
    <div className="grid gap-2 rounded-[14px] border border-[var(--plotty-line)] bg-[var(--plotty-surface-soft)] p-2 text-sm sm:grid-cols-2">
      <div className="min-w-0 space-y-1">
        <div className="plotty-kicker">Было</div>
        <p className="break-words text-[var(--plotty-ink)]">{issue.fragmentText}</p>
      </div>
      <div className="min-w-0 space-y-1">
        <div className="plotty-kicker">Замена</div>
        <p className="break-words font-semibold text-[var(--plotty-accent)]">{issue.suggestion}</p>
      </div>
    </div>
  );
}

function SpellcheckIssueOverlay({
  contentRef,
  isMobile,
  onApply,
  onDismiss,
  onClose,
  popover,
}: {
  contentRef: RefObject<HTMLDivElement | null>;
  isMobile: boolean;
  onApply: (issue: SpellcheckIssue) => void;
  onDismiss: (issue: SpellcheckIssue) => void;
  onClose: () => void;
  popover: { issue: SpellcheckIssue; position: PopoverPosition } | null;
}) {
  if (!popover) {
    return null;
  }

  if (isMobile) {
    return (
      <SpellcheckIssueBottomSheet
        contentRef={contentRef}
        issue={popover.issue}
        onApply={onApply}
        onDismiss={onDismiss}
        onClose={onClose}
      />
    );
  }

  return (
    <PopoverContent
      contentRef={contentRef}
      open
      position={popover.position}
      className="rounded-[var(--plotty-radius-lg)] p-4"
    >
      <SpellcheckIssueContent issue={popover.issue} onApply={onApply} onDismiss={onDismiss} />
    </PopoverContent>
  );
}

function SpellcheckIssueBottomSheet({
  contentRef,
  issue,
  onApply,
  onDismiss,
  onClose,
}: {
  contentRef: RefObject<HTMLDivElement | null>;
  issue: SpellcheckIssue;
  onApply: (issue: SpellcheckIssue) => void;
  onDismiss: (issue: SpellcheckIssue) => void;
  onClose: () => void;
}) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[110]">
      <button
        type="button"
        aria-label="Закрыть исправление"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(31,26,22,0.48)]"
      />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label="Исправление ошибки"
        className="absolute inset-x-0 bottom-0 min-w-0 max-h-[82vh] overflow-y-auto overflow-x-hidden rounded-t-[var(--plotty-radius-xl)] border border-[var(--plotty-line)] bg-[var(--plotty-surface-strong)] px-5 pt-5 shadow-[var(--plotty-shadow)]"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="plotty-section-title">Исправление</h2>
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Закрыть
          </Button>
        </div>
        <SpellcheckIssueContent issue={issue} onApply={onApply} onDismiss={onDismiss} />
      </div>
    </div>,
    document.body,
  );
}

function SpellcheckIssueContent({
  issue,
  onApply,
  onDismiss,
}: {
  issue: SpellcheckIssue;
  onApply: (issue: SpellcheckIssue) => void;
  onDismiss: (issue: SpellcheckIssue) => void;
}) {
  return (
    <div className="min-w-0 space-y-3">
      <div className="min-w-0 space-y-1">
        <div className="break-words text-sm leading-5 text-[var(--plotty-muted)]">{issue.message}</div>
        <SpellcheckPreview issue={issue} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => onApply(issue)}>
          Исправить
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onDismiss(issue)}>
          Оставить как есть
        </Button>
      </div>
    </div>
  );
}

function useCorrectionOverlayMode() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 640px), (pointer: coarse)");
    const update = () => setIsMobile(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function getIssuePopoverPosition(anchorRect: DOMRect): PopoverPosition {
  const viewportPadding = 12;
  const width = Math.min(320, window.innerWidth - viewportPadding * 2);
  const estimatedHeight = 164;
  const topBelow = anchorRect.bottom + 8;

  return {
    left: Math.min(Math.max(viewportPadding, anchorRect.left), window.innerWidth - width - viewportPadding),
    top:
      topBelow + estimatedHeight < window.innerHeight - viewportPadding
        ? topBelow
        : Math.max(viewportPadding, anchorRect.top - estimatedHeight - 8),
    width,
  };
}
