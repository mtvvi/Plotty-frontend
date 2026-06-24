"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { createPortal } from "react-dom";

import { cn } from "@/shared/lib/utils";
import { isUnoptimizedImageUrl, sanitizeImageUrl } from "@/shared/lib/safe-url";

interface ImageLightboxProps {
  src: string;
  alt: string;
  title?: string;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, title, open, onClose }: ImageLightboxProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const safeSrc = sanitizeImageUrl(src);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || !safeSrc) {
    return null;
  }

  return createPortal(
    <div
      className="plotty-image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Просмотр изображения: ${title}` : "Просмотр изображения"}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <button
        ref={closeButtonRef}
        type="button"
        className="plotty-image-lightbox-close"
        aria-label="Закрыть изображение"
        onClick={onClose}
      >
        <X className="size-5" aria-hidden="true" />
      </button>

      <figure className="plotty-image-lightbox-frame" onMouseDown={(event) => event.stopPropagation()}>
        <div className="plotty-image-lightbox-media">
          <Image
            src={safeSrc}
            alt={alt}
            fill
            sizes="100vw"
            unoptimized={isUnoptimizedImageUrl(safeSrc)}
            className="plotty-image-lightbox-image"
          />
        </div>
        {title ? <figcaption className="plotty-image-lightbox-caption">{title}</figcaption> : null}
      </figure>
    </div>,
    document.body,
  );
}

export function lightboxTriggerClassName(className?: string) {
  return cn(
    "border-0 bg-transparent p-0 text-inherit cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--plotty-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--plotty-paper)]",
    className,
  );
}
