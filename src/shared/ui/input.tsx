import type { InputHTMLAttributes } from "react";

import { fieldClassName } from "@/shared/ui/field";
import { cn } from "@/shared/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        fieldClassName("min-h-11"),
        className,
      )}
      {...props}
    />
  );
}
