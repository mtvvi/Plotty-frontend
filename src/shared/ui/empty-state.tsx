import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card className="p-6 text-center sm:p-8">
      <div className="mx-auto max-w-md space-y-3.5">
        <h3 className="plotty-section-title text-[1.35rem]">{title}</h3>
        {description ? <p className="plotty-body text-[var(--plotty-muted)]">{description}</p> : null}
        {actionLabel && onAction ? (
          <div className="pt-2">
            <Button variant="secondary" onClick={onAction} className="min-w-[10.5rem]">
              {actionLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
