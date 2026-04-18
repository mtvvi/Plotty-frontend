"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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

  const hasCover = Boolean(imageUrl && !hasImageError);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-[rgba(35,33,30,0.08)] bg-[linear-gradient(135deg,var(--plotty-panel),var(--plotty-paper))]",
        extendSurface ? "flex h-full flex-col" : "",
        className,
      )}
    >
      {hasCover ? (
        <div
          data-cover-frame="true"
          className={cn("relative w-full", fullHeight ? "h-full min-h-[18rem]" : "", imageClassName)}
          style={fullHeight ? undefined : { aspectRatio: fallbackAspectRatio }}
        >
          <Image
            src={imageUrl ?? ""}
            alt={`Обложка истории «${title}»`}
            fill
            sizes="100vw"
            unoptimized
            onError={() => setHasImageError(true)}
            className={cn("object-cover", fullHeight ? "object-left" : "")}
          />
        </div>
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
          <div className="max-w-[17rem] space-y-2.5">
            <div className="plotty-kicker">Plotty story</div>
            <div className={cn("plotty-section-title text-[var(--plotty-ink)]", compact ? "max-w-[13rem] text-[1.05rem]" : "max-w-[18rem]")}>
              {title}
            </div>
            <p className={cn("text-sm leading-6 text-[var(--plotty-muted)]", compact ? "max-w-[13rem]" : "max-w-[16rem]")}>
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
