"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { isUnoptimizedImageUrl, sanitizeImageUrl } from "@/shared/lib/safe-url";
import { cn } from "@/shared/lib/utils";
import { ImageLightbox, lightboxTriggerClassName } from "@/shared/ui/image-lightbox";

export const storyCoverPlaceholderSrc = "/story-cover-placeholder.jpg";

export function StoryCoverPreview({
  title,
  imageUrl,
  className,
  imageClassName,
  extendSurface = false,
  fullHeight = false,
  enableLightbox = false,
  isLoading = false,
  priority = false,
  sizes = "100vw",
}: {
  title: string;
  imageUrl?: string;
  className?: string;
  imageClassName?: string;
  compact?: boolean;
  extendSurface?: boolean;
  fullHeight?: boolean;
  enableLightbox?: boolean;
  isLoading?: boolean;
  priority?: boolean;
  sizes?: string;
}) {
  const safeImageUrl = sanitizeImageUrl(imageUrl);
  const [hasImageError, setHasImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(Boolean(safeImageUrl));
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const fallbackAspectRatio = "1 / 1";

  useEffect(() => {
    setHasImageError(false);
    setIsImageLoading(Boolean(safeImageUrl));
  }, [safeImageUrl]);

  const hasCover = Boolean(safeImageUrl && !hasImageError);
  const coverStyle = hasCover && !fullHeight ? { aspectRatio: fallbackAspectRatio } : undefined;
  const showLoadingIndicator = isLoading || isImageLoading;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--plotty-radius-lg)] border border-[var(--plotty-line)] bg-[linear-gradient(135deg,var(--plotty-panel),var(--plotty-paper))]",
        "plotty-cover-preview",
        extendSurface ? "flex h-full flex-col" : "",
        className,
      )}
    >
      {hasCover ? (
        enableLightbox ? (
          <button
            type="button"
            data-cover-frame="true"
            className={lightboxTriggerClassName(cn("relative block w-full overflow-hidden text-left", fullHeight ? "h-full min-h-[18rem]" : "", imageClassName))}
            style={coverStyle}
            aria-label={`Открыть обложку истории «${title}» на весь экран`}
            onClick={() => setIsLightboxOpen(true)}
          >
            <Image
              src={safeImageUrl ?? ""}
              alt={`Обложка истории «${title}»`}
              fill
              sizes={sizes}
              priority={priority}
              unoptimized={safeImageUrl ? isUnoptimizedImageUrl(safeImageUrl) : undefined}
              className="object-cover"
              onLoad={() => setIsImageLoading(false)}
              onError={() => {
                setHasImageError(true);
                setIsImageLoading(false);
              }}
            />
            {showLoadingIndicator ? <CoverLoadingIndicator /> : null}
          </button>
        ) : (
          <div
            data-cover-frame="true"
            className={cn("relative w-full overflow-hidden", fullHeight ? "h-full min-h-[18rem]" : "", imageClassName)}
            style={coverStyle}
          >
            <Image
              src={safeImageUrl ?? ""}
              alt={`Обложка истории «${title}»`}
              fill
              sizes={sizes}
              priority={priority}
              unoptimized={safeImageUrl ? isUnoptimizedImageUrl(safeImageUrl) : undefined}
              className="object-cover"
              onLoad={() => setIsImageLoading(false)}
              onError={() => {
                setHasImageError(true);
                setIsImageLoading(false);
              }}
            />
            {showLoadingIndicator ? <CoverLoadingIndicator /> : null}
          </div>
        )
      ) : (
        <div
          data-cover-frame="true"
          className={cn(
            "relative w-full overflow-hidden bg-[var(--plotty-paper)]",
            fullHeight ? "h-full min-h-[18rem]" : "",
            imageClassName,
          )}
          style={fullHeight ? undefined : { aspectRatio: fallbackAspectRatio }}
        >
          <Image
            src={storyCoverPlaceholderSrc}
            alt={`Обложка появится позже для истории «${title}»`}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
          />
          {isLoading ? <CoverLoadingIndicator /> : null}
        </div>
      )}

      {extendSurface ? (
        <div
          aria-hidden="true"
          className="relative min-h-0 flex-1 bg-[linear-gradient(180deg,#151311,#090908)]"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 -translate-y-full bg-[linear-gradient(180deg,rgba(9,9,8,0),rgba(9,9,8,0.25)_25%,rgba(9,9,8,0.96))]" />
        </div>
      ) : null}

      {hasCover && enableLightbox && safeImageUrl ? (
        <ImageLightbox
          src={safeImageUrl}
          alt={`Обложка истории «${title}»`}
          title={title}
          open={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
        />
      ) : null}
    </div>
  );
}

function CoverLoadingIndicator() {
  return (
    <span className="plotty-cover-loading" role="status" aria-live="polite">
      <span className="plotty-cover-loading-spinner" aria-hidden="true" />
      <span className="sr-only">Загружаем обложку</span>
    </span>
  );
}
