"use client";

import { useLinkStatus } from "next/link";
import { cn } from "@/lib/utils";

/** Indicador discreto de navegação em andamento (debounce de 100ms via CSS, sem shift de layout). */
export default function LinkPendingHint({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={cn("link-hint", pending && "is-pending", className)}
    />
  );
}
