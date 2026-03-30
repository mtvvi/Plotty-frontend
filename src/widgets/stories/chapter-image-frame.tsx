"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface ChapterImageFrameProps {
  title: string;
  imageUrl?: string;
}

export function ChapterImageFrame({ title, imageUrl }: ChapterImageFrameProps) {
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setHasFailed(false);
  }, [imageUrl]);

  if (!imageUrl || hasFailed) {
    return (
      <div className="flex aspect-[16/9] w-full items-end rounded-[28px] border border-[var(--plotty-line)] bg-[linear-gradient(135deg,var(--plotty-panel),var(--plotty-paper))] p-6">
        <div className="max-w-xl space-y-2">
          <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--plotty-muted)]">
            Иллюстрация
          </div>
          <div className="plotty-serif text-3xl font-semibold tracking-[-0.03em]">{title}</div>
          <p className="text-sm leading-6 text-[var(--plotty-muted)]">
            Для этой главы ещё нет готового изображения. Его можно сгенерировать из авторской мастерской.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-[var(--plotty-line)] bg-[var(--plotty-paper)]">
      <Image
        src={imageUrl}
        alt={title}
        width={960}
        height={540}
        unoptimized
        onError={() => setHasFailed(true)}
        className="aspect-[16/9] w-full object-cover"
      />
    </div>
  );
}
