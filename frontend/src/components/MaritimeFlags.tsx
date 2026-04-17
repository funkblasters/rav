import { useState, useRef, useEffect } from "react";

interface MaritimeFlagsProps {
  text: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-[14px] w-[14px]",
  md: "h-[16px] w-[16px]",
  lg: "h-[20px] w-[20px]",
};

const PADDING = 8; // min distance from viewport edge in px
const GAP = 6;     // gap between flags and tooltip in px

export function MaritimeFlags({ text, size = "lg" }: MaritimeFlagsProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // After the tooltip renders, clamp its position to stay within the viewport.
  useEffect(() => {
    if (!open || !tooltipRef.current || !wrapperRef.current) return;

    const tooltip = tooltipRef.current;
    const wrapperRect = wrapperRef.current.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // Ideal: centered above the wrapper
    let left = wrapperRect.left + wrapperRect.width / 2 - tooltipRect.width / 2;
    const top = wrapperRect.top - tooltipRect.height - GAP;

    // Clamp horizontally
    left = Math.max(PADDING, Math.min(left, window.innerWidth - tooltipRect.width - PADDING));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.opacity = "1";
  }, [open]);

  const letters = text
    .toUpperCase()
    .split("")
    .filter((c) => c >= "A" && c <= "Z");

  if (letters.length === 0) return null;

  return (
    <div className="inline-flex" ref={wrapperRef}>
      <div
        className="flex items-center gap-0.5 cursor-default select-none"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        {letters.map((letter, i) => (
          <img
            key={i}
            src={`/maritime-flags/${letter}.svg`}
            alt=""
            className={sizeClasses[size]}
            draggable={false}
          />
        ))}
      </div>

      {open && (
        <div
          ref={tooltipRef}
          className="fixed px-2 py-1 rounded bg-popover text-popover-foreground text-xs border shadow-md whitespace-nowrap z-50 pointer-events-none"
          // Start invisible at (0,0); the effect moves and reveals it
          style={{ opacity: 0, top: 0, left: 0 }}
        >
          {text.toUpperCase()}
        </div>
      )}
    </div>
  );
}
