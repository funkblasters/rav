import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { AvatarDisplay } from "@/components/UserPanel";
import { MyFlagsList } from "@/components/stats/MyFlagsList";
import { ContinentsPieChart } from "@/components/stats/ContinentsPieChart";
import { YearlyActivityHistogram } from "@/components/stats/YearlyActivityHistogram";
import { UserFlagsChoropleth } from "@/components/stats/UserFlagsChoropleth";

const USER_PROFILE_HEADER = gql`
  query UserProfileHeader($userId: ID!) {
    userProfile(userId: $userId) {
      id
      displayName
      avatarUrl
    }
  }
`;

const MY_PROFILE_HEADER = gql`
  query MyProfileHeader {
    myProfile {
      id
      displayName
      avatarUrl
    }
  }
`;

export function StatsPage() {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId?: string }>();
  const { user: currentUser } = useAuth();

  const { data: userProfileData } = useQuery(USER_PROFILE_HEADER, {
    variables: { userId },
    skip: !userId,
  });

  const { data: myProfileData } = useQuery(MY_PROFILE_HEADER, {
    skip: !!userId,
  });

  const displayName: string | undefined = userId
    ? userProfileData?.userProfile?.displayName
    : (myProfileData?.myProfile?.displayName ?? currentUser?.displayName);

  const avatarUrl: string | null | undefined = userId
    ? userProfileData?.userProfile?.avatarUrl
    : myProfileData?.myProfile?.avatarUrl;

  const title = displayName ?? "…";
  const subtitle = userId
    ? (displayName !== undefined ? t("stats.userSubtitle") : "")
    : t("stats.subtitle");

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Page Title */}
      <div className="px-4 pb-4 shrink-0 grid grid-cols-[auto_1fr] gap-x-3">
        <div className="row-span-2 self-center">
          {displayName ? (
            <AvatarDisplay displayName={displayName} avatarUrl={avatarUrl} size="sm" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-muted" />
          )}
        </div>
        <h1 className="text-2xl font-bold self-end">{title}</h1>
        <p className="text-muted-foreground text-sm self-start">{subtitle}</p>
      </div>

      {/* Mobile Layout — stacked */}
      <div className="flex-1 min-h-0 flex flex-col gap-6 px-4 pb-8 overflow-y-auto lg:hidden">
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
        className="hidden lg:grid flex-1 min-h-0 gap-6 px-4 pb-8 overflow-hidden"
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
