import { formatCreditsAmount } from "@/entities/credits/model/credit-utils";
import { cn } from "@/shared/lib/utils";

export function CreditCostBadge({ cost, className }: { cost: number; className?: string }) {
  return (
    <span
      className={cn(
        "plotty-badge-motion pointer-events-none absolute -right-2 top-0 inline-flex min-h-6 min-w-10 items-center justify-center rounded-md bg-[var(--plotty-accent)] px-2 text-[10px] font-bold leading-none text-white shadow-[0_6px_14px_rgba(195,79,50,0.24)] ring-2 ring-[var(--plotty-paper)]",
        className,
      )}
      aria-label={`Стоимость: ${formatCreditsAmount(cost)}`}
    >
      {cost} кр
    </span>
  );
}
