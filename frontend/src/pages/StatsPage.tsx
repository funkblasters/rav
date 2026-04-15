import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { MyFlagsList } from "@/components/stats/MyFlagsList";
import { ContinentsPieChart } from "@/components/stats/ContinentsPieChart";
import { YearlyActivityHistogram } from "@/components/stats/YearlyActivityHistogram";
import { UserFlagsChoropleth } from "@/components/stats/UserFlagsChoropleth";

const USER_DISPLAY_NAME = gql`
  query UserDisplayName($userId: ID!) {
    userProfile(userId: $userId) {
      id
      displayName
    }
  }
`;

const AVATAR_COLORS = [
  "bg-slate-400", "bg-slate-500", "bg-zinc-400", "bg-zinc-500",
  "bg-stone-400", "bg-stone-500", "bg-neutral-400", "bg-neutral-500",
];

function getAvatarColor(name: string): string {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function StatsPage() {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId?: string }>();
  const { user: currentUser } = useAuth();

  const { data: userProfileData } = useQuery(USER_DISPLAY_NAME, {
    variables: { userId },
    skip: !userId,
  });

  const displayName: string | undefined = userId
    ? userProfileData?.userProfile?.displayName
    : currentUser?.displayName;

  const title = userId ? (displayName ?? "…") : t("stats.title");
  const subtitle = userId
    ? (displayName !== undefined ? t("stats.userSubtitle") : "")
    : t("stats.subtitle");

  const avatarColor = displayName ? getAvatarColor(displayName) : "bg-muted";
  const avatarInitial = displayName?.charAt(0).toUpperCase() ?? "";

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Page Title */}
      <div className="px-4 pb-4 shrink-0 grid grid-cols-[auto_1fr] gap-x-3">
        <div
          className={`row-span-2 w-14 h-14 rounded-full ${avatarColor} flex items-center justify-center text-2xl font-bold text-white self-center`}
        >
          {avatarInitial}
        </div>
        <h1 className="text-2xl font-bold self-end">{title}</h1>
        <p className="text-muted-foreground text-sm self-start">{subtitle}</p>
      </div>

      {/* Mobile Layout — stacked */}
      <div className="flex-1 min-h-0 flex flex-col gap-6 px-4 pb-4 overflow-y-auto lg:hidden">
        <div className="min-h-[320px]">
          <ContinentsPieChart userId={userId} />
        </div>
        <div className="min-h-[250px]">
          <YearlyActivityHistogram userId={userId} />
        </div>
        <div className="min-h-[450px] flex-1">
          <MyFlagsList userId={userId} displayName={displayName} />
        </div>
        <div className="min-h-[300px]">
          <UserFlagsChoropleth userId={userId} />
        </div>
      </div>

      {/* Desktop Layout — grid with areas */}
      <div
        className="hidden lg:grid flex-1 min-h-0 gap-6 px-4 pb-4 overflow-hidden"
        style={{
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gridTemplateAreas: `"list pie bar" "list map map"`,
        }}
      >
        <div style={{ gridArea: "list" }} className="min-h-0 overflow-hidden">
          <MyFlagsList userId={userId} displayName={displayName} />
        </div>
        <div style={{ gridArea: "pie" }} className="min-h-0 overflow-hidden">
          <ContinentsPieChart userId={userId} />
        </div>
        <div style={{ gridArea: "bar" }} className="min-h-0 overflow-hidden">
          <YearlyActivityHistogram userId={userId} />
        </div>
        <div style={{ gridArea: "map" }} className="min-h-0 overflow-hidden">
          <UserFlagsChoropleth userId={userId} />
        </div>
      </div>
    </div>
  );
}
