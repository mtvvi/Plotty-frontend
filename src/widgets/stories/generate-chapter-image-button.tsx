"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { creditBalanceQueryOptions, creditsKeys } from "@/entities/credits/api/credits-api";
import { AI_CREDIT_COSTS, formatCreditsAmount } from "@/entities/credits/model/credit-utils";
import {
  aiJobQueryOptions,
  startImageGeneration,
  storyKeys,
} from "@/entities/story/api/stories-api";
import {
  setGeneratedImageUrl as cacheGeneratedImageUrl,
  setGeneratedStoryCoverUrl,
} from "@/entities/story/model/generated-image-cache";
import type { AiJobStatus, ChapterDetails, ImageGenerationResult } from "@/entities/story/model/types";
import { isInsufficientCreditsError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Field, FieldLabel } from "@/shared/ui/field";
import { AsyncJobStatus, type AsyncJobStatusValue } from "@/shared/ui/motion";
import { Textarea } from "@/shared/ui/textarea";
import { CreditCostBadge } from "@/widgets/credits/credit-cost-badge";

export function GenerateChapterImageButton({
  chapterId,
  storyId,
  chapterTitle,
  chapterContent,
  storySlug,
  storyTitle,
  hasImage: hasExistingImage = false,
  onImageGenerated,
}: {
  chapterId: string;
  storyId: string;
  chapterTitle: string;
  chapterContent: string;
  storySlug: string;
  storyTitle?: string;
  hasImage?: boolean;
  onImageGenerated?: (imageUrl: string) => void;
}) {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState("");
  const [creditError, setCreditError] = useState("");
  const defaultPrompt = useMemo(
    () => `Иллюстрация к главе "${chapterTitle}" истории "${storyTitle ?? storySlug}"`,
    [chapterTitle, storySlug, storyTitle],
  );
  const [promptDraft, setPromptDraft] = useState(defaultPrompt);
  const [promptTouched, setPromptTouched] = useState(false);

  const imageMutation = useMutation({
    mutationFn: startImageGeneration,
  });
  const balanceQuery = useQuery(creditBalanceQueryOptions());

  const jobQuery = useQuery({
    ...aiJobQueryOptions<ImageGenerationResult>(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      return status === "completed" || status === "failed" ? false : 2_000;
    },
  });

  const generatedImageUrl = jobQuery.data?.result?.images[0]?.imageUrl;

  useEffect(() => {
    if (!generatedImageUrl) {
      return;
    }

    onImageGenerated?.(generatedImageUrl);
    cacheGeneratedImageUrl(chapterId, generatedImageUrl);
    setGeneratedStoryCoverUrl(storySlug, generatedImageUrl);
    queryClient.setQueryData<ChapterDetails>(storyKeys.chapter(chapterId), patchChapterImageUrl(generatedImageUrl));
    queryClient.setQueryData<ChapterDetails>(
      storyKeys.chapterEditor(storyId, chapterId),
      patchChapterImageUrl(generatedImageUrl),
    );

    void Promise.all([
      queryClient.invalidateQueries({ queryKey: storyKeys.chapter(chapterId) }),
      queryClient.invalidateQueries({ queryKey: storyKeys.chapterEditor(storyId, chapterId) }),
      queryClient.invalidateQueries({ queryKey: storyKeys.details(storySlug) }),
      queryClient.invalidateQueries({ queryKey: storyKeys.all }),
    ]);
  }, [chapterId, generatedImageUrl, onImageGenerated, queryClient, storyId, storySlug]);

  async function handleGenerate() {
    setCreditError("");
    const content = chapterContent.trim();

    if (!content) {
      setCreditError("Не удалось сгенерировать иллюстрацию");
      return;
    }

    try {
      const accepted = await imageMutation.mutateAsync({
        chapterId,
        content,
        prompt: promptDraft.trim() || defaultPrompt,
      });

      setJobId(accepted.jobId);
      await queryClient.invalidateQueries({ queryKey: creditsKeys.balance() });
    } catch (error) {
      if (isInsufficientCreditsError(error)) {
        setCreditError(getInsufficientCreditsMessage(balanceQuery.data?.balance));
        return;
      }

      setCreditError("Не удалось сгенерировать иллюстрацию");
    }
  }

  const canGenerate = Boolean(chapterContent.trim());
  const isGenerating =
    imageMutation.isPending || jobQuery.data?.status === "queued" || jobQuery.data?.status === "processing";
  const hasGeneratedImage = Boolean(generatedImageUrl);
  const hasImage = hasExistingImage || hasGeneratedImage;
  const imageStatus = getImageAsyncStatus({
    isPending: imageMutation.isPending,
    status: jobQuery.data?.status,
    hasResult: hasGeneratedImage,
    hasError: Boolean(creditError),
  });

  useEffect(() => {
    if (!promptTouched) {
      setPromptDraft(defaultPrompt);
    }
  }, [defaultPrompt, promptTouched]);
  const imageStatusError = creditError || undefined;
  const shouldOfferTopUp =
    typeof balanceQuery.data?.balance === "number" && balanceQuery.data.balance < AI_CREDIT_COSTS.imageGeneration;
  const buttonLabel =
    imageStatus === "failed"
      ? "Повторить генерацию"
      : hasImage
        ? "Обновить иллюстрацию"
        : "Сгенерировать картинку";

  return (
    <div className="space-y-3">
      {shouldOfferTopUp ? (
        <ButtonLink href={routes.credits} prefetch={false} variant="ghost" size="sm">
          Пополнить баланс
        </ButtonLink>
      ) : null}
      <AsyncJobStatus
        compact
        status={imageStatus}
        label={getImageStatusLabel(imageStatus)}
        error={imageStatusError === getImageStatusLabel(imageStatus) ? undefined : imageStatusError}
      />
      {creditError ? (
        <ButtonLink href={routes.credits} prefetch={false} variant="secondary" size="sm">
          Пополнить
        </ButtonLink>
      ) : null}
      <Field>
        <FieldLabel htmlFor={`chapter-image-prompt-${chapterId}`}>Промпт для иллюстрации</FieldLabel>
        <Textarea
          id={`chapter-image-prompt-${chapterId}`}
          value={promptDraft}
          onChange={(event) => {
            setPromptTouched(true);
            setPromptDraft(event.target.value);
          }}
          className="min-h-24 text-sm leading-6"
        />
      </Field>
      <span className="relative inline-flex">
        <Button variant="secondary" onClick={handleGenerate} disabled={!canGenerate} isLoading={isGenerating}>
          {buttonLabel}
        </Button>
        <CreditCostBadge cost={AI_CREDIT_COSTS.imageGeneration} />
      </span>
    </div>
  );
}

function getImageStatusLabel(status: AsyncJobStatusValue) {
  if (status === "completed") {
    return "Готово";
  }

  if (status === "failed") {
    return "Не удалось сгенерировать иллюстрацию";
  }

  return "Генерируем иллюстрацию";
}

function patchChapterImageUrl(imageUrl: string) {
  return (current: ChapterDetails | undefined) => (current ? { ...current, imageUrl } : current);
}

function getImageAsyncStatus({
  isPending,
  status,
  hasResult,
  hasError,
}: {
  isPending: boolean;
  status?: AiJobStatus;
  hasResult: boolean;
  hasError: boolean;
}): AsyncJobStatusValue {
  if (hasError || status === "failed") {
    return "failed";
  }

  if (isPending) {
    return "queued";
  }

  if (status === "queued" || status === "processing") {
    return status;
  }

  if (status === "completed" && hasResult) {
    return "completed";
  }

  return "idle";
}

function getInsufficientCreditsMessage(balance?: number) {
  const balanceText = typeof balance === "number" ? ` Сейчас на балансе ${formatCreditsAmount(balance)}.` : "";

  return `Недостаточно кредитов для изображения: нужно ${formatCreditsAmount(AI_CREDIT_COSTS.imageGeneration)}.${balanceText}`;
}
