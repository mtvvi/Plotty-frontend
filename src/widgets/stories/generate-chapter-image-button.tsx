"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { creditBalanceQueryOptions, creditsKeys } from "@/entities/credits/api/credits-api";
import { AI_CREDIT_COSTS, formatCreditsAmount } from "@/entities/credits/model/credit-utils";
import {
  aiJobQueryOptions,
  chapterDetailsQueryOptions,
  startImageGeneration,
  storyKeys,
} from "@/entities/story/api/stories-api";
import type { ImageGenerationResult } from "@/entities/story/model/types";
import { isInsufficientCreditsError } from "@/shared/api/fetch-json";
import { routes } from "@/shared/config/routes";
import { Button, ButtonLink } from "@/shared/ui/button";
import { Surface } from "@/shared/ui/card";
import { CreditCostBadge } from "@/widgets/credits/credit-cost-badge";

export function GenerateChapterImageButton({
  chapterId,
  chapterTitle,
  storySlug,
  storyTitle,
}: {
  chapterId: string;
  chapterTitle: string;
  storySlug: string;
  storyTitle?: string;
}) {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState("");
  const [creditError, setCreditError] = useState("");

  const imageMutation = useMutation({
    mutationFn: startImageGeneration,
  });
  const balanceQuery = useQuery(creditBalanceQueryOptions());
  const chapterQuery = useQuery({
    ...chapterDetailsQueryOptions(chapterId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const jobQuery = useQuery({
    ...aiJobQueryOptions<ImageGenerationResult>(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;

      return status === "completed" || status === "failed" ? false : 2_000;
    },
  });

  useEffect(() => {
    if (!jobQuery.data?.result?.images[0]?.imageUrl) {
      return;
    }

    void Promise.all([
      queryClient.invalidateQueries({ queryKey: storyKeys.chapter(chapterId) }),
      queryClient.invalidateQueries({ queryKey: storyKeys.details(storySlug) }),
      queryClient.invalidateQueries({ queryKey: storyKeys.all }),
    ]);
  }, [chapterId, jobQuery.data?.result?.images, queryClient, storySlug]);

  async function handleGenerate() {
    setCreditError("");

    try {
      const chapter = await queryClient.fetchQuery(chapterDetailsQueryOptions(chapterId));
      const accepted = await imageMutation.mutateAsync({
        chapterId,
        content: chapter.content,
        prompt: `Иллюстрация к главе "${chapter.title || chapterTitle}" истории "${storyTitle ?? storySlug}"`,
      });

      setJobId(accepted.jobId);
      await queryClient.invalidateQueries({ queryKey: creditsKeys.balance() });
    } catch (error) {
      if (isInsufficientCreditsError(error)) {
        setCreditError(getInsufficientCreditsMessage(balanceQuery.data?.balance));
        return;
      }

      setCreditError("Не удалось запустить генерацию изображения. Попробуйте ещё раз.");
    }
  }

  const isGenerating =
    imageMutation.isPending || jobQuery.data?.status === "queued" || jobQuery.data?.status === "processing";
  const hasImage = Boolean(chapterQuery.data?.imageUrl || jobQuery.data?.result?.images[0]?.imageUrl);
  const shouldOfferTopUp =
    typeof balanceQuery.data?.balance === "number" && balanceQuery.data.balance < AI_CREDIT_COSTS.imageGeneration;

  return (
    <div className="space-y-3">
      {shouldOfferTopUp ? (
        <ButtonLink href={routes.credits} variant="ghost" size="sm">
          Пополнить баланс
        </ButtonLink>
      ) : null}
      {isGenerating ? (
        <p className="plotty-meta" aria-live="polite">
          Генерируем иллюстрацию...
        </p>
      ) : null}
      {creditError ? (
        <Surface variant="subtle" className="space-y-3 p-3">
          <p className="text-sm font-semibold text-[var(--plotty-danger)]">{creditError}</p>
          <ButtonLink href={routes.credits} variant="secondary" size="sm">
            Пополнить
          </ButtonLink>
        </Surface>
      ) : null}
      <span className="relative inline-flex">
        <Button variant="secondary" onClick={handleGenerate} isLoading={isGenerating}>
          {hasImage ? "Обновить иллюстрацию" : "Сгенерировать картинку"}
        </Button>
        <CreditCostBadge cost={AI_CREDIT_COSTS.imageGeneration} />
      </span>
    </div>
  );
}

function getInsufficientCreditsMessage(balance?: number) {
  const balanceText = typeof balance === "number" ? ` Сейчас на балансе ${formatCreditsAmount(balance)}.` : "";

  return `Недостаточно кредитов для изображения: нужно ${formatCreditsAmount(AI_CREDIT_COSTS.imageGeneration)}.${balanceText}`;
}
