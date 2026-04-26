"use client";

import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/utils";

export function StoryCoverPreview({
  title,
  imageUrl,
  className,
  imageClassName,
  compact = false,
  extendSurface = false,
  fullHeight = false,
}: {
  title: string;
  imageUrl?: string;
  className?: string;
  imageClassName?: string;
  compact?: boolean;
  extendSurface?: boolean;
  fullHeight?: boolean;
}) {
  const [hasImageError, setHasImageError] = useState(false);
  const fallbackAspectRatio = "1 / 1";

  useEffect(() => {
    setHasImageError(false);
  }, [imageUrl]);

  useEffect(() => {
    if (!imageUrl) {
      return;
    }

    const probe = new window.Image();

    probe.onload = () => setHasImageError(false);
    probe.onerror = () => setHasImageError(true);
    probe.src = imageUrl;

    return () => {
      probe.onload = null;
      probe.onerror = null;
    };
  }, [imageUrl]);

  const hasCover = Boolean(imageUrl && !hasImageError);
  const coverStyle = hasCover
    ? {
        ...(fullHeight ? {} : { aspectRatio: fallbackAspectRatio }),
        backgroundImage: `url(${JSON.stringify(imageUrl)})`,
      }
    : undefined;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--plotty-radius-lg)] border border-[var(--plotty-line)] bg-[linear-gradient(135deg,var(--plotty-panel),var(--plotty-paper))]",
        extendSurface ? "flex h-full flex-col" : "",
        className,
      )}
    >
      {hasCover ? (
        <div
          data-cover-frame="true"
          role="img"
          aria-label={`Обложка истории «${title}»`}
          className={cn("relative w-full bg-cover bg-center", fullHeight ? "h-full min-h-[18rem]" : "", imageClassName)}
          style={coverStyle}
        />
      ) : (
        <div
          data-cover-frame="true"
          className={cn(
            "flex w-full items-end",
            fullHeight ? "h-full min-h-[18rem]" : "",
            imageClassName,
            compact ? "p-4" : "p-5 sm:p-6",
          )}
          style={fullHeight ? undefined : { aspectRatio: fallbackAspectRatio }}
        >
          <div className={cn("max-w-[17rem] space-y-2.5", compact ? "max-md:space-y-0" : "")}>
            <div className="plotty-kicker">Plotty story</div>
            <div
              className={cn(
                "plotty-section-title text-[var(--plotty-ink)]",
                compact ? "max-w-[13rem] text-[1.05rem] max-md:hidden" : "max-w-[18rem]",
              )}
            >
              {title}
            </div>
            <p className={cn("text-sm leading-6 text-[var(--plotty-muted)]", compact ? "max-w-[13rem] max-md:hidden" : "max-w-[16rem]")}>
              Обложка появится, когда у первой главы будет иллюстрация.
            </p>
          </div>
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
    </div>
  );
}
