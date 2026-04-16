import { useQuery, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { BarChart2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QueryStateRenderer } from "@/components/QueryStateRenderer";
import { List, ListItem } from "@/components/ui/list";
import { ClubRoleBadge } from "@/components/ClubRoleBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { AvatarDisplay } from "@/components/UserPanel";

const TOP_MEMBERS = gql`
  query TopMembers {
    topMembers {
      id
      displayName
      clubRole
      flagsCount
      avatarUrl
    }
  }
`;

const FLAGS_BY_USER = gql`
  query FlagsByUser($userId: ID!) {
    flagsByUser(userId: $userId) {
      id
      name
      imageUrl
    }
  }
`;


interface Member {
  id: string;
  displayName: string;
  clubRole: string;
  flagsCount: number;
  avatarUrl?: string | null;
}

function MemberFlagsSheet({
  member,
  currentUserId,
  onClose,
}: {
  member: Member | null;
  currentUserId: string | undefined;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, loading } = useQuery(FLAGS_BY_USER, {
    variables: { userId: member?.id },
    skip: !member,
  });

  const flags: { id: string; name: string; imageUrl?: string }[] = data?.flagsByUser ?? [];

  const handleViewStats = () => {
    if (member) {
      onClose();
      navigate(member.id === currentUserId ? "/stats" : `/stats/${member.id}`);
    }
  };

  return (
    <Sheet open={!!member} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="bottom" className="max-h-[75dvh] flex flex-col" showCloseButton={false}>
        <SheetHeader className="shrink-0 border-b pb-3">
          <div className="flex items-center gap-3">
            {member && (
              <AvatarDisplay
                displayName={member.displayName}
                avatarUrl={member.avatarUrl}
                size="sm"
              />
            )}
            <div className="flex-1 min-w-0 flex flex-col">
              <SheetTitle className="truncate">{member?.displayName}</SheetTitle>
              <SheetDescription>
                {loading ? "…" : `${flags.length} flag${flags.length !== 1 ? "s" : ""}`}
              </SheetDescription>
            </div>
            <Button
              variant="default"
              size="lg"
              className="shrink-0 gap-2 font-bold"
              onClick={handleViewStats}
            >
              <BarChart2 size={16} />
              {t("stats.viewStats")}
            </Button>
          </div>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2 p-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[3/2] rounded bg-muted animate-pulse" />
            ))}
            </div>
          </div>
        ) : flags.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No public flags yet.</p>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2 p-2">
            {flags.map((flag) => (
              <div
                key={flag.id}
                className="aspect-[3/2] rounded border bg-muted/30 overflow-hidden"
                title={flag.name}
              >
                {flag.imageUrl ? (
                  <img
                    src={flag.imageUrl}
                    alt={flag.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-1">
                    <span className="text-[9px] text-muted-foreground text-center leading-tight">
                      {flag.name}
                    </span>
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function Rankings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { data, loading, error, refetch } = useQuery(TOP_MEMBERS);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const members: Member[] = data?.topMembers ?? [];

  useEffect(() => {
    const handleFocus = () => refetch();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetch]);

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
  };

  return (
    <>
      <Card className="h-full flex flex-col overflow-hidden">
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="text-base font-semibold">Ranking</CardTitle>
          <CardDescription>{t("dashboard.statisticsSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-hidden flex flex-col">
          <QueryStateRenderer
            loading={loading}
            error={error}
            empty={!members.length && !loading}
          >
            <div className="p-4 h-full flex flex-col">
              {/* Ranking List */}
              <div className="overflow-y-auto flex-1">
                <List>
                  {members.map((member, idx) => (
                    <ListItem
                      key={member.id}
                      className={`space-x-2 cursor-pointer select-none ${idx < 3 ? "rank-shine" : ""}`}
                      onClick={() => handleMemberClick(member)}
                    >
                      {/* Rank */}
                      <span className={`flex-shrink-0 w-6 text-center text-sm font-bold ${
                        idx === 0 ? "text-yellow-500" :
                        idx === 1 ? "text-slate-400" :
                        idx === 2 ? "text-amber-700" :
                        "text-muted-foreground"
                      }`}>
                        #{idx + 1}
                      </span>

                      {/* Avatar */}
                      <div className="shrink-0">
                        <AvatarDisplay
                          displayName={member.displayName}
                          avatarUrl={member.avatarUrl}
                          size="xs"
                        />
                      </div>

                      {/* Name + club role */}
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{member.displayName}</p>
                        {member.clubRole !== "ORDINARY_ASSOCIATE" && (
                          <span className="shrink-0 hidden md:inline">
                            <ClubRoleBadge role={member.clubRole} collapsible />
                          </span>
                        )}
                      </div>

                      {/* Flags Count + Badge + Chevron */}
                      <div className="flex items-center gap-2 flex-shrink-0 ml-auto md:ml-0">
                        {member.clubRole !== "ORDINARY_ASSOCIATE" && (
                          <span className="md:hidden">
                            <ClubRoleBadge role={member.clubRole} collapsible />
                          </span>
                        )}
                        <span className="text-xl font-bold">
                          {member.flagsCount}
                        </span>
                        <ChevronRight size={16} className="text-muted-foreground" />
                      </div>
                    </ListItem>
                  ))}
                </List>
              </div>

            </div>
          </QueryStateRenderer>
        </CardContent>
      </Card>

      <MemberFlagsSheet
        member={selectedMember}
        currentUserId={currentUser?.id}
        onClose={() => setSelectedMember(null)}
      />
    </>
  );
}
