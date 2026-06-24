"use client";

import Link from "next/link";

import type { StoryTag } from "@/entities/story/model/types";
import { routes } from "@/shared/config/routes";
import { chipClassName, type ChipTone } from "@/shared/ui/chip";

export function getStoryTagHref(tag: Pick<StoryTag, "slug">) {
  const params = new URLSearchParams();
  params.set("tag", tag.slug);

  return `${routes.home}?${params.toString()}`;
}

export function getStoryTagTone(tag: Pick<StoryTag, "category">): ChipTone {
  if (tag.category === "completion") {
    return "olive";
  }

  if (tag.category === "warning" || tag.category === "directionality") {
    return "gold";
  }

  return "default";
}

export function StoryTagLinkChip({
  tag,
  className,
}: {
  tag: StoryTag;
  className?: string;
}) {
  return (
    <Link
      href={getStoryTagHref(tag)}
      prefetch={false}
      aria-label={`Фильтр: ${tag.name}`}
      title={`Показать истории с тегом «${tag.name}»`}
      className="pointer-events-auto relative z-30 rounded-[var(--plotty-radius-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]"
    >
      <span className={chipClassName(false, className, getStoryTagTone(tag))}>{tag.name}</span>
    </Link>
  );
}
