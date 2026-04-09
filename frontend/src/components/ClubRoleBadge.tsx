import { useTranslation } from "react-i18next";
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

export function ClubRoleBadge({ role }: { role: ClubRole | string }) {
  const { t } = useTranslation();
  const label = t(`profile.clubRoles.${role}`, { defaultValue: role });

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
