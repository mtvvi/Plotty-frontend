export const AI_CREDIT_COSTS = {
  spellcheck: 1,
  logicCheck: 2,
  canonCheck: 2,
  imageGeneration: 3,
} as const;

export function formatCreditsAmount(amount: number) {
  const abs = Math.abs(amount);
  const lastTwo = abs % 100;
  const last = abs % 10;
  const suffix = lastTwo >= 11 && lastTwo <= 14 ? "кредитов" : last === 1 ? "кредит" : last >= 2 && last <= 4 ? "кредита" : "кредитов";

  return `${amount} ${suffix}`;
}

export function formatCreditPrice(priceKopecks: number) {
  const rubles = priceKopecks / 100;

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: priceKopecks % 100 === 0 ? 0 : 2,
    maximumFractionDigits: priceKopecks % 100 === 0 ? 0 : 2,
  }).format(rubles);
}

export function formatCreditTransactionAmount(amount: number) {
  return amount > 0 ? `+${formatCreditsAmount(amount)}` : formatCreditsAmount(amount);
}
