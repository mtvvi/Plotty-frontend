import { cn } from "@/shared/lib/utils";

import type { StoryTag } from "@/entities/story/model/types";

export function StoryTagChip({
  tag,
  active,
  onClick,
}: {
  tag: StoryTag;
  active?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-2 text-xs font-bold transition-colors",
        active
          ? "border-[var(--plotty-ink)] bg-[var(--plotty-ink)] text-[var(--plotty-paper)]"
          : "border-[var(--plotty-line)] bg-white/80 text-[var(--plotty-muted)]",
      )}
    >
      {tag.name}
    </span>
  );

  if (!onClick) {
    return content;
  }

  return (
    <button type="button" onClick={onClick}>
      {content}
    </button>
  );
}
