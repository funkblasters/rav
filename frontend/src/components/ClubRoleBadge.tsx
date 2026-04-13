import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

type ClubRole =
  | "CHAIRMAN"
  | "VICE_CHAIRMAN"
  | "HONORARY_CHAIRMAN"
  | "TREASURER"
  | "SECRETARY"
  | "ORDINARY_ASSOCIATE";

const GOLD = new Set(["CHAIRMAN", "VICE_CHAIRMAN", "HONORARY_CHAIRMAN"]);
const RED = new Set(["TREASURER", "SECRETARY"]);

function getBadgeColor(role: ClubRole | string): string {
  if (GOLD.has(role)) return "bg-amber-500";
  if (RED.has(role)) return "bg-red-500";
  return "bg-slate-300";
}

export function ClubRoleBadge({ role, collapsible = false }: { role: ClubRole | string; collapsible?: boolean }) {
  const { t } = useTranslation();
  const label = t(`profile.clubRoles.${role}`, { defaultValue: role });
  const [expanded, setExpanded] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);
  const expandedTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-collapse after 3 seconds
  useEffect(() => {
    if (expanded) {
      expandedTimeoutRef.current = setTimeout(() => {
        setExpanded(false);
      }, 3000);
    }
    return () => {
      if (expandedTimeoutRef.current) {
        clearTimeout(expandedTimeoutRef.current);
      }
    };
  }, [expanded]);

  // Close on outside click
  useEffect(() => {
    if (!expanded || !collapsible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (badgeRef.current && !badgeRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expanded, collapsible]);

  const badgeColor = getBadgeColor(role);

  // Collapsible version (mobile only)
  if (collapsible) {
    return (
      <div ref={badgeRef} className="relative" style={{ overflow: 'visible' }}>
        {/* Circle on mobile, full badge on desktop */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`
            md:hidden w-6 h-6 rounded-full ${badgeColor} text-white text-xs font-bold
            flex items-center justify-center cursor-pointer transition-all hover:opacity-80
          `}
          title={label}
          aria-label={label}
        >
          {label.charAt(0).toUpperCase()}
        </button>

        {/* Expanded overlay on mobile - positioned to the left */}
        {expanded && (
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 z-50 pointer-events-auto">
            <Badge className={`${badgeColor} text-white border-transparent whitespace-nowrap shadow-lg`}>
              {label}
            </Badge>
          </div>
        )}

        {/* Full badge on desktop */}
        <div className="hidden md:block">
          {GOLD.has(role) && (
            <Badge className="bg-amber-500 text-white border-transparent hover:bg-amber-500/90">
              {label}
            </Badge>
          )}
          {RED.has(role) && !GOLD.has(role) && <Badge variant="destructive">{label}</Badge>}
          {!GOLD.has(role) && !RED.has(role) && <Badge variant="secondary">{label}</Badge>}
        </div>
      </div>
    );
  }

  // Non-collapsible version (original behavior)
  if (GOLD.has(role)) {
    return (
      <Badge className="bg-amber-500 text-white border-transparent hover:bg-amber-500/90">
        {label}
      </Badge>
    );
  }
  if (RED.has(role)) {
    return <Badge variant="destructive">{label}</Badge>;
  }
  return <Badge variant="secondary">{label}</Badge>;
}
