"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, Send } from "lucide-react";
import { useRouter } from "next/navigation";

import { suggestFandom } from "@/entities/fandom/api/fandom-api";
import {
  FANDOM_DESCRIPTION_MAX_LENGTH,
  type SuggestedFandom,
} from "@/entities/fandom/model/types";
import type { StoryTag } from "@/entities/story/model/types";
import { ApiError, isAuthError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { toUserFacingErrorMessage } from "@/shared/lib/user-facing-error";
import { Button } from "@/shared/ui/button";
import { Field, FieldError, FieldHint, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { AnimatedDisclosurePanel } from "@/shared/ui/motion";
import { Surface } from "@/shared/ui/card";
import { Textarea } from "@/shared/ui/textarea";

const duplicateFandomMessage = "Такой фандом уже есть в списке";
const suggestionFallbackMessage = "Не удалось отправить заявку";

function getFandomSuggestionErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const normalizedMessage = error.message.toLowerCase();

    if (error.status === 409 || normalizedMessage.includes("already exists")) {
      return duplicateFandomMessage;
    }
  }

  return toUserFacingErrorMessage(error, suggestionFallbackMessage);
}

export function FandomSuggestionPanel({
  authNext,
  fallbackTag,
  isFallbackSelected,
  onSelectFallback,
}: {
  authNext: string;
  fallbackTag?: StoryTag;
  isFallbackSelected: boolean;
  onSelectFallback: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [suggestedFandom, setSuggestedFandom] = useState<SuggestedFandom | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const suggestMutation = useMutation({ mutationFn: suggestFandom });
  const remainingDescriptionLength = FANDOM_DESCRIPTION_MAX_LENGTH - description.length;
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const canSubmit = Boolean(
    trimmedName &&
      trimmedDescription &&
      description.length <= FANDOM_DESCRIPTION_MAX_LENGTH &&
      !suggestMutation.isPending,
  );
  const fallbackLabel = useMemo(() => {
    if (!fallbackTag) {
      return "";
    }

    return isFallbackSelected ? `${fallbackTag.name} выбран` : `Выбрать ${fallbackTag.name}`;
  }, [fallbackTag, isFallbackSelected]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setErrorMessage("");

    try {
      const fandom = await suggestMutation.mutateAsync({
        name: trimmedName,
        description: trimmedDescription,
      });

      setSuggestedFandom(fandom);
      setName("");
      setDescription("");
    } catch (error) {
      if (isAuthError(error)) {
        router.push(routes.auth({ next: authNext }));
        return;
      }

      setErrorMessage(getFandomSuggestionErrorMessage(error));
    }
  }

  return (
    <Surface variant="subtle" className="space-y-4 p-4 sm:p-5">
      <div className="space-y-1.5">
        <p className="plotty-meta">
          Отправьте название и описание на модерацию. После одобрения фандом появится в списке.
        </p>
      </div>

      {suggestedFandom ? (
        <div
          className="flex items-start gap-3 rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-[var(--plotty-surface-soft)] p-4 text-sm text-[var(--plotty-ink)]"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--plotty-olive)]" aria-hidden="true" />
          <div className="space-y-1">
            <div className="font-semibold">{suggestedFandom.name} отправлен на модерацию</div>
            <p className="text-[var(--plotty-muted)]">
              Для текущей истории выберите существующий временный фандом. Новый можно будет выбрать после одобрения.
            </p>
          </div>
        </div>
      ) : null}

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field>
          <FieldLabel htmlFor="fandom-suggestion-name">Название фандома</FieldLabel>
          <Input
            id="fandom-suggestion-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Например, Аркейн"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="fandom-suggestion-description">Описание канона</FieldLabel>
          <Textarea
            id="fandom-suggestion-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={FANDOM_DESCRIPTION_MAX_LENGTH}
            placeholder="Ключевые персонажи, правила мира, важные события и ограничения канона"
          />
          <FieldHint>{remainingDescriptionLength} символов осталось</FieldHint>
        </Field>

        {errorMessage ? <FieldError role="alert">{errorMessage}</FieldError> : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {fallbackTag ? (
            <Button
              type="button"
              variant="secondary"
              onClick={onSelectFallback}
              disabled={isFallbackSelected}
            >
              {fallbackLabel}
            </Button>
          ) : (
            <span className="plotty-meta">Временный фандом недоступен</span>
          )}

          <Button type="submit" variant="primary" disabled={!canSubmit} isLoading={suggestMutation.isPending}>
            <Send className="size-4" aria-hidden="true" />
            Отправить заявку
          </Button>
        </div>
      </form>
    </Surface>
  );
}

export function FandomSuggestionDisclosure(props: {
  authNext: string;
  fallbackTag?: StoryTag;
  isFallbackSelected: boolean;
  onSelectFallback: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="secondary"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="w-full justify-between border-dashed"
      >
        Фандома нет в списке?
        <ChevronDown
          className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </Button>

      <AnimatedDisclosurePanel open={isOpen}>
        <FandomSuggestionPanel {...props} />
      </AnimatedDisclosurePanel>
    </div>
  );
}
