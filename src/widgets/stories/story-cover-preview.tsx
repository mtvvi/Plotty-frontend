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
}: {
  title: string;
  imageUrl?: string;
  className?: string;
  imageClassName?: string;
  compact?: boolean;
}) {
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [imageUrl]);

  const hasCover = Boolean(imageUrl && !hasImageError);
  const mediaClassName = cn("aspect-[16/10] h-full w-full", imageClassName);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-[rgba(35,33,30,0.08)] bg-[linear-gradient(135deg,var(--plotty-panel),var(--plotty-paper))]",
        className,
      )}
    >
      {hasCover ? (
        <Image
          src={imageUrl ?? ""}
          alt={`Обложка истории «${title}»`}
          width={960}
          height={540}
          unoptimized
          onError={() => setHasImageError(true)}
          className={cn(mediaClassName, "object-cover")}
        />
      ) : (
        <div className={cn("flex items-end", mediaClassName, compact ? "p-4" : "p-5")}>
          <div className="space-y-2">
            <div className="plotty-meta text-xs font-bold uppercase tracking-[0.12em]">Plotty story</div>
            <div className={cn("plotty-section-title text-[var(--plotty-ink)]", compact ? "max-w-[14rem]" : "max-w-[18rem]")}>
              {title}
            </div>
            <p className={cn("plotty-meta", compact ? "max-w-[14rem]" : "max-w-[18rem]")}>
              Обложка появится автоматически, когда у первой главы будет иллюстрация.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
