import { queryOptions } from "@tanstack/react-query";

import { fetchJson } from "@/shared/api/fetch-json";

import type {
  CreditBalanceResponse,
  CreditPackage,
  CreditPurchasePayload,
  CreditPurchaseResponse,
  CreditTransaction,
} from "../model/types";

export const creditsKeys = {
  all: ["credits"] as const,
  balance: () => ["credits", "balance"] as const,
  packages: () => ["credits", "packages"] as const,
  transactions: () => ["credits", "transactions"] as const,
};

export function creditBalanceQueryOptions(options?: { enabled?: boolean; refetchInterval?: number | false }) {
  return queryOptions({
    queryKey: creditsKeys.balance(),
    queryFn: () => fetchJson<CreditBalanceResponse>("/credits/balance"),
    staleTime: 15_000,
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
  });
}

export function creditPackagesQueryOptions() {
  return queryOptions({
    queryKey: creditsKeys.packages(),
    queryFn: () => fetchJson<CreditPackage[]>("/credits/packages"),
    staleTime: 5 * 60_000,
  });
}

export function creditTransactionsQueryOptions(options?: { enabled?: boolean; refetchInterval?: number | false }) {
  return queryOptions({
    queryKey: creditsKeys.transactions(),
    queryFn: () => fetchJson<CreditTransaction[]>("/credits/transactions"),
    staleTime: 15_000,
    enabled: options?.enabled,
    refetchInterval: options?.refetchInterval,
  });
}

export function initiateCreditPurchase(payload: CreditPurchasePayload) {
  return fetchJson<CreditPurchaseResponse>("/credits/purchase", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
