import { useQuery, useMutation, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MY_FLAGS = gql`
  query GetMyFlags {
    myFlags {
      id
      name
      imageUrl
      acquiredAt
      isPublic
    }
  }
`;

const FLAGS_BY_USER_LIST = gql`
  query FlagsByUserList($userId: ID!) {
    flagsByUser(userId: $userId) {
      id
      name
      imageUrl
      acquiredAt
    }
  }
`;

const MAKE_PUBLIC = gql`
  mutation MakePublic($flagId: ID!) {
    makePublic(flagId: $flagId) {
      id
      name
      imageUrl
      acquiredAt
      isPublic
      description
      addedBy {
        id
        displayName
      }
      togetherWith {
        id
        displayName
      }
    }
  }
`;

interface MyFlag {
  id: string;
  name: string;
  imageUrl?: string;
  acquiredAt: string;
  isPublic: boolean;
}

interface UserFlag {
  id: string;
  name: string;
  imageUrl?: string;
  acquiredAt: string;
}

export function MyFlagsList({ userId, displayName }: { userId?: string; displayName?: string }) {
  const { t } = useTranslation();

  // Own flags query
  const { data: myData, loading: myLoading, refetch } = useQuery(MY_FLAGS, { skip: !!userId });
  const [makePublic, { loading: publishing }] = useMutation(MAKE_PUBLIC, {
    refetchQueries: ["GetMyFlags", "TopMembers", "MyProfile", "LastFlag", "MostWantedFlag", "FlagsGeo", "NewsItems", "GetFlags"],
    awaitRefetchQueries: true,
  });

  // Other user's flags query
  const { data: userData, loading: userLoading } = useQuery(FLAGS_BY_USER_LIST, {
    variables: { userId },
    skip: !userId,
  });

  useEffect(() => {
    if (userId) return;
    refetch();
    const handleFocus = () => refetch();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetch, userId]);

  if (userId) {
    const userFlags: UserFlag[] = userData?.flagsByUser ?? [];
    const loading = userLoading;
    const title = displayName ? t("stats.userFlagsList", { name: displayName }) : "…";

    return (
      <Card className="flex flex-col h-full overflow-hidden">
        <CardHeader className="pb-2 shrink-0">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <CardDescription className="text-xs">
            {loading ? t("common.loading") : `${userFlags.length} flag${userFlags.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-[3/2] rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : userFlags.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("myFlags.noFlags")}</p>
          ) : (
            <div className="space-y-2">
              {userFlags.map((flag) => (
                <div key={flag.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  {flag.imageUrl ? (
                    <img
                      src={flag.imageUrl}
                      alt={flag.name}
                      className="w-12 h-8 object-cover rounded shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-8 bg-muted rounded shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{flag.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(flag.acquiredAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Own stats view
  const myFlags: MyFlag[] = myData?.myFlags ?? [];
  const loading = myLoading;
  const publicFlags = myFlags.filter((f) => f.isPublic);
  const secretFlags = myFlags.filter((f) => !f.isPublic);

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <CardHeader className="pb-2 shrink-0">
        <CardTitle className="text-base font-semibold">{t("myFlags.title")}</CardTitle>
        <CardDescription className="text-xs">
          {loading
            ? t("common.loading")
            : t("myFlags.description_one", {
                public: publicFlags.length,
                secret: secretFlags.length,
              })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 min-h-0 overflow-y-auto">

        {/* Secret flags */}
        {secretFlags.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("myFlags.secret")}
            </h3>
            <div className="space-y-2">
              {secretFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-muted/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {flag.imageUrl ? (
                      <img
                        src={flag.imageUrl}
                        alt={flag.name}
                        className="w-12 h-8 object-cover rounded shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-8 bg-muted rounded shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{flag.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(flag.acquiredAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={publishing}
                    onClick={() => makePublic({ variables: { flagId: flag.id } })}
                  >
                    {t("myFlags.makePublic")}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Public flags */}
        {publicFlags.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t("myFlags.public")}
            </h3>
            <div className="space-y-2">
              {publicFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  {flag.imageUrl ? (
                    <img
                      src={flag.imageUrl}
                      alt={flag.name}
                      className="w-12 h-8 object-cover rounded shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-8 bg-muted rounded shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{flag.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(flag.acquiredAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && myFlags.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("myFlags.noFlags")}</p>
        )}
      </CardContent>
    </Card>
  );
}
