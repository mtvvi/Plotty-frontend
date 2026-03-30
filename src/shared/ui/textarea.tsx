import type { TextareaHTMLAttributes } from "react";

import { fieldClassName } from "@/shared/ui/field";
import { cn } from "@/shared/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        fieldClassName("min-h-36 px-4 py-3 leading-7"),
        className,
      )}
      {...props}
    />
  );
}
