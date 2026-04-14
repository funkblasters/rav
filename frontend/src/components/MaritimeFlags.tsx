interface MaritimeFlagsProps {
  text: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-[14px] w-[14px]",
  md: "h-[16px] w-[16px]",
  lg: "h-[20px] w-[20px]",
};

export function MaritimeFlags({ text, size = "lg" }: MaritimeFlagsProps) {
  const letters = text
    .toUpperCase()
    .split("")
    .filter((c) => c >= "A" && c <= "Z");

  if (letters.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5">
      {letters.map((letter, i) => (
        <img
          key={i}
          src={`/maritime-flags/${letter}.svg`}
          alt={letter}
          title={letter}
          className={sizeClasses[size]}
          draggable={false}
        />
      ))}
    </div>
  );
}
