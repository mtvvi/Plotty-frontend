import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card className="p-8 text-center">
      <div className="mx-auto max-w-md space-y-3">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-sm leading-6 text-[var(--plotty-muted)]">{description}</p>
        {actionLabel && onAction ? (
          <div className="pt-2">
            <Button onClick={onAction}>{actionLabel}</Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

