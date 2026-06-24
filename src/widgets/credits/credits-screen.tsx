"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, CreditCard, RefreshCw } from "lucide-react";

import {
  creditBalanceQueryOptions,
  creditPackagesQueryOptions,
  creditTransactionsQueryOptions,
  creditsKeys,
  initiateCreditPurchase,
} from "@/entities/credits/api/credits-api";
import {
  formatCreditPrice,
  formatCreditsAmount,
  formatCreditTransactionAmount,
} from "@/entities/credits/model/credit-utils";
import type { CreditPackage, CreditTransaction } from "@/entities/credits/model/types";
import { isApiError } from "@/shared/api/fetch-json";
import { useRafCounter } from "@/shared/lib/raf-counter";
import { sanitizeUserFacingMessage } from "@/shared/lib/user-facing-error";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, Surface } from "@/shared/ui/card";
import { Chip } from "@/shared/ui/chip";
import { EmptyState } from "@/shared/ui/empty-state";
import { AnimatedList, AnimatedTabPanel, AsyncJobStatus } from "@/shared/ui/motion";
import { SegmentedControl, TabButton } from "@/shared/ui/tabs";
import { PlottyPageShell } from "@/widgets/layout/plotty-page-shell";

type CreditsTab = "packages" | "transactions";

const transactionFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const aiTransactionTitles: Record<string, string> = {
  spellcheck: "Проверка орфографии главы",
  logic_check: "Проверка логики главы",
  canon_check: "Проверка канона главы",
  image_generation: "Генерация иллюстрации к главе",
};

export function CreditsScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<CreditsTab>("packages");
  const [purchaseError, setPurchaseError] = useState("");
  const [isReturnPolling, setIsReturnPolling] = useState(hasCreditReturnMarker);
  const transactionsEnabled = activeTab === "transactions";

  const balanceQuery = useQuery(
    creditBalanceQueryOptions({ refetchInterval: isReturnPolling ? 3_000 : false }),
  );
  const packagesQuery = useQuery(creditPackagesQueryOptions());
  const transactionsQuery = useQuery(
    creditTransactionsQueryOptions({
      enabled: transactionsEnabled,
      refetchInterval: isReturnPolling && transactionsEnabled ? 3_000 : false,
    }),
  );
  const purchaseMutation = useMutation({
    mutationFn: initiateCreditPurchase,
  });

  useEffect(() => {
    if (!isReturnPolling) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: creditsKeys.balance() });

    if (transactionsEnabled) {
      void queryClient.invalidateQueries({ queryKey: creditsKeys.transactions() });
    }

    const timeout = window.setTimeout(() => setIsReturnPolling(false), 20_000);

    return () => window.clearTimeout(timeout);
  }, [isReturnPolling, queryClient, transactionsEnabled]);

  const packages = useMemo(() => packagesQuery.data ?? [], [packagesQuery.data]);
  const transactions = transactionsQuery.data ?? [];
  const balance = balanceQuery.data?.balance;
  const bestPackageId = useMemo(() => getBestPackageId(packages), [packages]);
  const creditFeedbackStatus = purchaseError
    ? "failed"
    : purchaseMutation.isPending
      ? "processing"
      : "idle";

  async function refreshCredits() {
    const refreshes = [
      queryClient.invalidateQueries({ queryKey: creditsKeys.balance() }),
    ];

    if (transactionsEnabled) {
      refreshes.push(queryClient.invalidateQueries({ queryKey: creditsKeys.transactions() }));
    }

    await Promise.all(refreshes);
  }

  async function handlePurchase(pkg: CreditPackage) {
    setPurchaseError("");

    try {
      const response = await purchaseMutation.mutateAsync({ packageId: pkg.id });
      window.location.assign(response.payUrl);
    } catch (error) {
      setPurchaseError(getPurchaseErrorMessage(error));
    }
  }

  return (
    <PlottyPageShell
      pageTitle="Кредиты"
      pageActions={
        <Button
          variant="secondary"
          onClick={refreshCredits}
          isLoading={balanceQuery.isFetching || (transactionsEnabled && transactionsQuery.isFetching)}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Обновить
        </Button>
      }
    >
      <div className="space-y-6">
        <BalanceSummary balance={balance} isLoading={balanceQuery.isLoading} />

        <AsyncJobStatus
          status={creditFeedbackStatus}
          label={purchaseError ? "Не удалось начать оплату" : "Открываем оплату"}
          description={purchaseMutation.isPending ? "Готовим ссылку на платежную страницу." : undefined}
          error={purchaseError || undefined}
        />

        <SegmentedControl className="w-full sm:w-fit">
          <TabButton type="button" isActive={activeTab === "packages"} onClick={() => setActiveTab("packages")}>
            Пакеты
          </TabButton>
          <TabButton
            type="button"
            isActive={activeTab === "transactions"}
            onClick={() => setActiveTab("transactions")}
          >
            История
          </TabButton>
        </SegmentedControl>

        <AnimatedTabPanel activeKey={activeTab} panelKey="packages">
          <section className="space-y-4" aria-label="Пакеты кредитов">
            {packagesQuery.isLoading ? (
              <PackageSkeleton />
            ) : packages.length ? (
              <div className="grid gap-4 md:grid-cols-3">
                {packages.map((pkg) => (
                  <CreditPackageCard
                    key={pkg.id}
                    pkg={pkg}
                    isBestValue={pkg.id === bestPackageId}
                    isPending={purchaseMutation.isPending}
                    onPurchase={() => handlePurchase(pkg)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="Пакеты недоступны" description="Не удалось получить варианты пополнения." />
            )}
          </section>
        </AnimatedTabPanel>
        <AnimatedTabPanel activeKey={activeTab} panelKey="transactions">
          <TransactionsList transactions={transactions} isLoading={transactionsQuery.isLoading} />
        </AnimatedTabPanel>
      </div>
    </PlottyPageShell>
  );
}

function BalanceSummary({ balance, isLoading }: { balance?: number; isLoading: boolean }) {
  const balanceRef = useRef<HTMLDivElement | null>(null);
  const numericBalance = typeof balance === "number" && !isLoading ? balance : null;
  const formatBalance = useCallback((value: number) => formatCreditsAmount(value), []);

  useRafCounter(balanceRef, numericBalance, formatBalance);

  return (
    <Card variant="default" className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="plotty-kicker">Баланс</div>
          <div className="flex items-center gap-3">
            <Coins className="size-7 text-[var(--plotty-accent)]" aria-hidden="true" />
            <div
              ref={balanceRef}
              data-raf-counter="credits-balance"
              className="text-3xl font-semibold text-[var(--plotty-ink)]"
            >
              {isLoading ? "..." : formatCreditsAmount(balance ?? 0)}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function hasCreditReturnMarker() {
  if (typeof window === "undefined") {
    return false;
  }

  const params = new URLSearchParams(window.location.search);

  return ["payment", "checkout", "orderId", "status", "success", "cancel", "canceled"].some((key) =>
    params.has(key),
  );
}

function CreditPackageCard({
  pkg,
  isBestValue,
  isPending,
  onPurchase,
}: {
  pkg: CreditPackage;
  isBestValue: boolean;
  isPending: boolean;
  onPurchase: () => void;
}) {
  return (
    <Card variant="interactive" className="flex min-h-64 flex-col p-5">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold text-[var(--plotty-ink)]">{formatCreditsAmount(pkg.credits)}</div>
            <p className="plotty-meta">Пакет #{pkg.id}</p>
          </div>
          {isBestValue ? <Chip tone="gold">Выгоднее</Chip> : null}
        </div>
        <div className="text-xl font-semibold text-[var(--plotty-accent)]">{formatCreditPrice(pkg.priceKopecks)}</div>
      </div>

      <Button className="mt-auto" variant={isBestValue ? "primary" : "secondary"} isLoading={isPending} onClick={onPurchase}>
        <CreditCard className="size-4" aria-hidden="true" />
        Купить
      </Button>
    </Card>
  );
}

function TransactionsList({
  transactions,
  isLoading,
}: {
  transactions: CreditTransaction[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <section className="space-y-3" aria-label="История кредитов">
        <div className="h-20 rounded-[var(--plotty-radius-md)] bg-white/60" />
        <div className="h-20 rounded-[var(--plotty-radius-md)] bg-white/60" />
        <div className="h-20 rounded-[var(--plotty-radius-md)] bg-white/60" />
      </section>
    );
  }

  if (!transactions.length) {
    return (
      <section aria-label="История кредитов">
        <EmptyState title="Операций пока нет" description="Покупки и списания AI-кредитов появятся здесь." />
      </section>
    );
  }

  return (
    <section aria-label="История кредитов">
      <AnimatedList
        items={transactions}
        getKey={(transaction) => transaction.id}
        className="space-y-3"
        renderItem={(transaction) => (
          <Surface variant="listItem" className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="font-semibold text-[var(--plotty-ink)]">{getTransactionTitle(transaction)}</div>
                <p className="plotty-meta">{formatTransactionDate(transaction.createdAt)}</p>
              </div>
              <Badge tone={transaction.amount > 0 ? "olive" : "accent"}>
                {formatCreditTransactionAmount(transaction.amount)}
              </Badge>
            </div>
          </Surface>
        )}
      />
    </section>
  );
}

function PackageSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="h-64 rounded-[var(--plotty-radius-lg)] bg-white/60" />
      <div className="h-64 rounded-[var(--plotty-radius-lg)] bg-white/60" />
      <div className="h-64 rounded-[var(--plotty-radius-lg)] bg-white/60" />
    </div>
  );
}

function getBestPackageId(packages: CreditPackage[]) {
  let bestPackageId = packages[0]?.id ?? 0;
  let bestCreditsPerKopeck = 0;

  packages.forEach((pkg) => {
    const creditsPerKopeck = pkg.credits / pkg.priceKopecks;

    if (creditsPerKopeck > bestCreditsPerKopeck) {
      bestCreditsPerKopeck = creditsPerKopeck;
      bestPackageId = pkg.id;
    }
  });

  return bestPackageId;
}

function getTransactionTitle(transaction: CreditTransaction) {
  const description = transaction.description?.trim();
  const aiTransactionTitle = description ? getAiTransactionTitle(description) : undefined;

  if (aiTransactionTitle) {
    return aiTransactionTitle;
  }

  if (transaction.type === "purchase") {
    return "Покупка кредитов";
  }

  if (description) {
    return description;
  }

  return transaction.amount > 0 ? "Пополнение кредитов" : "Списание кредитов за AI-инструмент";
}

function getAiTransactionTitle(description: string) {
  const match = /^AI:\s*([a-z0-9_-]+)$/i.exec(description);

  if (!match) {
    return undefined;
  }

  return aiTransactionTitles[match[1].toLowerCase()] ?? "Списание за AI-инструмент";
}

function formatTransactionDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : transactionFormatter.format(date);
}

function getPurchaseErrorMessage(error: unknown) {
  if (!isApiError(error)) {
    return "Не удалось начать оплату. Попробуйте ещё раз.";
  }

  if (error.status === 404) {
    return "Такой пакет кредитов больше недоступен.";
  }

  return sanitizeUserFacingMessage(error.message, "Не удалось начать оплату. Попробуйте ещё раз.");
}
