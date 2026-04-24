"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { cn } from "@/shared/lib/utils";

interface ChapterImageFrameProps {
  title: string;
  imageUrl?: string;
  variant?: "default" | "reader";
}

export function ChapterImageFrame({ title, imageUrl, variant = "default" }: ChapterImageFrameProps) {
  const [hasFailed, setHasFailed] = useState(false);
  const isReader = variant === "reader";

  useEffect(() => {
    setHasFailed(false);
  }, [imageUrl]);

  if (!imageUrl || hasFailed) {
    return (
      <div
        data-chapter-image-frame="true"
        className={cn(
          "flex w-full items-end border border-[var(--plotty-line)] bg-[linear-gradient(135deg,var(--plotty-panel),var(--plotty-paper))]",
          isReader
            ? "mx-auto aspect-square max-w-[min(70ch,100%)] rounded-[24px] p-5 sm:p-6"
            : "aspect-square rounded-[28px] p-6",
        )}
      >
        <div className="max-w-xl space-y-2">
          <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--plotty-muted)]">
            Иллюстрация
          </div>
          <div className="plotty-serif text-3xl font-semibold tracking-[-0.03em]">{title}</div>
          <p className="text-sm leading-6 text-[var(--plotty-muted)]">
            Для этой главы ещё нет готового изображения. Его можно сгенерировать прямо из редактора главы.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-chapter-image-frame="true"
      className={cn(
        "overflow-hidden border border-[var(--plotty-line)] bg-[var(--plotty-paper)]",
        isReader ? "mx-auto w-full max-w-[min(70ch,100%)] rounded-[24px]" : "rounded-[28px]",
      )}
    >
      <div data-chapter-image-surface="true" className="relative aspect-square w-full">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="100vw"
          unoptimized
          onError={() => setHasFailed(true)}
          className="object-cover"
        />
      </div>
    </div>
  );
}
