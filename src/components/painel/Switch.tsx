"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  className?: string;
};

export default function Switch({
  id,
  checked,
  disabled,
  onChange,
  ariaLabel,
  ariaLabelledBy,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Atributo HTML nativo `switch` (Safari 17.4+); nos demais navegadores,
  // `role="switch"` + estilização direta no input garantem a mesma semântica.
  useEffect(() => {
    inputRef.current?.setAttribute("switch", "");
  }, []);

  return (
    <input
      ref={inputRef}
      id={id}
      type="checkbox"
      role="switch"
      checked={checked}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      onChange={(e) => onChange(e.target.checked)}
      style={{ accentColor: "var(--primary)" }}
      className={cn(
        "relative inline-block h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full border align-middle transition-colors",
        "border-input bg-muted checked:border-primary checked:bg-primary",
        "after:pointer-events-none after:absolute after:left-0.5 after:top-1/2 after:size-[18px] after:-translate-y-1/2 after:rounded-full after:bg-muted-foreground after:transition-transform after:content-['']",
        "checked:after:translate-x-5 checked:after:bg-primary-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "motion-reduce:transition-none motion-reduce:after:transition-none",
        className,
      )}
    />
  );
}
