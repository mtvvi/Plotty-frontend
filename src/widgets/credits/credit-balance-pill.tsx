"use client";

import { Coins, Plus } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { creditBalanceQueryOptions } from "@/entities/credits/api/credits-api";
import { formatCreditsAmount } from "@/entities/credits/model/credit-utils";
import { useAuth } from "@/entities/auth/model/auth-context";
import { routes } from "@/shared/config/routes";
import { cn } from "@/shared/lib/utils";

export function CreditBalancePill({
  variant = "compact",
  onNavigate,
}: {
  variant?: "compact" | "menu";
  onNavigate?: () => void;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const balanceQuery = useQuery(creditBalanceQueryOptions({ enabled: isAuthenticated }));

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const label = balanceQuery.isLoading ? "Кредиты..." : formatCreditsAmount(balanceQuery.data?.balance ?? 0);

  if (variant === "menu") {
    return (
      <Link
        href={routes.credits}
        onClick={onNavigate}
        className="plotty-button-label flex min-h-11 items-center justify-between gap-3 rounded-[var(--plotty-radius-md)] border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.8)] px-4 py-3 text-[var(--plotty-ink)] shadow-[0_4px_14px_rgba(58,43,27,0.04)] transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-[1px] hover:border-[var(--plotty-line-strong)] hover:bg-[var(--plotty-paper-strong)] hover:shadow-[0_16px_30px_rgba(58,43,27,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]"
        aria-label={`Пополнить баланс: ${label}`}
      >
        <span>{label}</span>
        <Plus className="size-4 text-[var(--plotty-accent)]" aria-hidden="true" />
      </Link>
    );
  }

  return (
    <Link
      href={routes.credits}
      onClick={onNavigate}
      className={cn(
        "plotty-button-label inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[var(--plotty-line)] bg-[rgba(255,253,249,0.78)] px-3 text-sm text-[var(--plotty-ink)] shadow-[0_4px_14px_rgba(58,43,27,0.04)] transition-[background-color,border-color,color] hover:border-[var(--plotty-line-strong)] hover:bg-[var(--plotty-paper-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]",
        balanceQuery.isError && "text-[var(--plotty-muted)]",
      )}
      aria-label="Открыть баланс кредитов"
    >
      <Coins className="size-4 text-[var(--plotty-accent)]" aria-hidden="true" />
      {label}
    </Link>
  );
}
