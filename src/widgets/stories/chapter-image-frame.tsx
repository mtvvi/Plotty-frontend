"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { isUnoptimizedImageUrl, sanitizeImageUrl } from "@/shared/lib/safe-url";
import { ImageLightbox, lightboxTriggerClassName } from "@/shared/ui/image-lightbox";

interface ChapterImageFrameProps {
  title: string;
  imageUrl?: string;
  enableLightbox?: boolean;
}

export function ChapterImageFrame({ title, imageUrl, enableLightbox = true }: ChapterImageFrameProps) {
  const safeImageUrl = sanitizeImageUrl(imageUrl);
  const [hasFailed, setHasFailed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    setHasFailed(false);
  }, [safeImageUrl]);

  if (!safeImageUrl || hasFailed) {
    return (
      <div
        data-chapter-image-frame="true"
        className="plotty-cover-preview relative flex aspect-square w-full items-end rounded-[28px] border border-[var(--plotty-line)] bg-[linear-gradient(135deg,var(--plotty-panel),var(--plotty-paper))] p-6"
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
      className="plotty-cover-preview relative overflow-hidden rounded-[28px] border border-[var(--plotty-line)] bg-[var(--plotty-paper)]"
    >
      {enableLightbox ? (
        <button
          type="button"
          data-chapter-image-surface="true"
          className={lightboxTriggerClassName("relative block aspect-square w-full overflow-hidden text-left")}
          aria-label={`Открыть иллюстрацию главы «${title}» на весь экран`}
          onClick={() => setIsLightboxOpen(true)}
        >
          <Image
            src={safeImageUrl}
            alt={title}
            fill
            sizes="min(100vw, 48rem)"
            unoptimized={isUnoptimizedImageUrl(safeImageUrl)}
            onError={() => setHasFailed(true)}
            className="object-cover"
          />
        </button>
      ) : (
        <div data-chapter-image-surface="true" className="relative aspect-square w-full">
          <Image
            src={safeImageUrl}
            alt={title}
            fill
            sizes="min(100vw, 48rem)"
            unoptimized={isUnoptimizedImageUrl(safeImageUrl)}
            onError={() => setHasFailed(true)}
            className="object-cover"
          />
        </div>
      )}
      {enableLightbox ? (
        <ImageLightbox
          src={safeImageUrl}
          alt={title}
          title={title}
          open={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
        />
      ) : null}
    </div>
  );
}
