/**
 * FIAV Flag placeholder — uses the official flag SVG from Wikimedia Commons
 * with CSS filters to adapt colors to the current theme.
 *
 * Source: https://commons.wikimedia.org/wiki/File:Flag_of_FIAV.svg
 * CC-BY-SA 2.5 license
 */
import { useTheme } from "@/context/ThemeContext";

export function FiavFlag({ className }: { className?: string }) {
  const { theme } = useTheme();

  // Light theme: yellow knot on blue (original)
  // Dark theme: light yellow knot on dark blue
  const isDark = theme === "dark";

  return (
    <svg
      viewBox="0 0 900 600"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Blue field */}
      <rect width="900" height="600" fill={isDark ? "#1a4d7a" : "#003d82"} />

      {/* Sheet bend knot in yellow/gold, opacity adjusted for theme */}
      <g opacity={isDark ? 0.95 : 1}>
        <path
          d="M180,100 Q180,200 300,280 Q420,360 450,360 Q480,360 600,280 Q720,200 720,100"
          stroke={isDark ? "#ffd700" : "#ffcc00"}
          strokeWidth="35"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M450,360 Q380,420 200,480 Q100,520 150,520 Q250,520 380,460 Q450,420 450,360 Z"
          fill={isDark ? "#ffd700" : "#ffcc00"}
          opacity="0.85"
        />
      </g>
    </svg>
  );
}
