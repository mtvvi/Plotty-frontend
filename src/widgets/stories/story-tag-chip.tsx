import type { StoryTag } from "@/entities/story/model/types";
import { Chip } from "@/shared/ui/chip";

export function StoryTagChip({
  tag,
  active,
  onClick,
}: {
  tag: StoryTag;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <Chip selected={active} onClick={onClick}>
      {tag.name}
    </Chip>
  );
}
