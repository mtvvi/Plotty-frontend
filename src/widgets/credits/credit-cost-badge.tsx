import { formatCreditsAmount } from "@/entities/credits/model/credit-utils";
import { cn } from "@/shared/lib/utils";

export function CreditCostBadge({ cost, className }: { cost: number; className?: string }) {
  const label = `Стоимость: ${formatCreditsAmount(cost)}`;

  return (
    <span
      className={cn(
        "plotty-badge-motion plotty-credit-cost-badge pointer-events-none -right-2 -top-2 inline-flex size-6 flex-col items-center justify-center rounded-full bg-[var(--plotty-accent)] p-0 text-white shadow-[0_5px_12px_rgba(195,79,50,0.22)] ring-2 ring-[var(--plotty-paper)]",
        className,
      )}
      aria-label={label}
      title={label}
    >
      <span aria-hidden="true" className="text-[9px] font-extrabold leading-none">
        {cost}
      </span>
      <span aria-hidden="true" className="text-[6px] font-bold leading-none">
        кр
      </span>
    </span>
  );
}
