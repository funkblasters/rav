import { useQuery, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QueryStateRenderer } from "@/components/QueryStateRenderer";
import { List, ListItem } from "@/components/ui/list";
import { ClubRoleBadge } from "@/components/ClubRoleBadge";

const TOP_MEMBERS = gql`
  query TopMembers {
    topMembers {
      id
      displayName
      clubRole
      flagsCount
    }
  }
`;

// Avatar colors using shadcn neutral palette
const AVATAR_COLORS = [
  "bg-slate-400",
  "bg-slate-500",
  "bg-zinc-400",
  "bg-zinc-500",
  "bg-stone-400",
  "bg-stone-500",
  "bg-neutral-400",
  "bg-neutral-500",
];

function getAvatarColor(name: string): string {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function Statistics() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, loading, error } = useQuery(TOP_MEMBERS);

  const members = data?.topMembers ?? [];

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-base font-semibold">{t("dashboard.statistics")}</CardTitle>
        <CardDescription>{t("dashboard.statisticsSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0 overflow-hidden flex flex-col">
        <QueryStateRenderer
          loading={loading}
          error={error}
          empty={!members.length && !loading}
        >
          <div className="p-4 h-full flex flex-col">
            {/* Ranking List - Full width */}
            <div className="overflow-y-auto flex-1">
              <List>
                {members.map((member: { id: string; displayName: string; clubRole: string; flagsCount: number }, idx: number) => (
                  <ListItem key={member.id} className="space-x-2">
                    {/* Rank */}
                    <span className="flex-shrink-0 w-8 text-center text-xl font-bold text-muted-foreground">
                      {idx + 1}
                    </span>

                    {/* Initial Avatar */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full ${getAvatarColor(
                        member.displayName
                      )} flex items-center justify-center text-lg font-bold text-white`}
                    >
                      {member.displayName.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + club role */}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{member.displayName}</p>
                      <span className="shrink-0"><ClubRoleBadge role={member.clubRole} /></span>
                    </div>

                    {/* Flags Count */}
                    <span className="flex-shrink-0 text-xl font-bold">
                      {member.flagsCount}
                    </span>
                  </ListItem>
                ))}
              </List>
            </div>

            {/* CTA - only on mobile */}
            <div className="flex flex-col items-center justify-center mt-4 lg:hidden">
              <Button size="lg" onClick={() => navigate("/stats")}>
                {t("dashboard.viewStatistics")}
              </Button>
            </div>
          </div>
        </QueryStateRenderer>
      </CardContent>
    </Card>
  );
}
