import { useQuery, useMutation, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export function MyFlagsList() {
  const { t } = useTranslation();
  const { data, loading, refetch } = useQuery(MY_FLAGS);
  const [makePublic, { loading: publishing }] = useMutation(MAKE_PUBLIC, {
    refetchQueries: ["GetMyFlags", "TopMembers", "MyProfile", "LastFlag", "MostWantedFlag", "FlagsGeo", "NewsItems", "GetFlags"],
    awaitRefetchQueries: true,
  });

  useEffect(() => {
    refetch();

    const handleFocus = () => {
      refetch();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [refetch]);

  const myFlags: MyFlag[] = data?.myFlags ?? [];
  const publicFlags = myFlags.filter((f) => f.isPublic);
  const secretFlags = myFlags.filter((f) => !f.isPublic);

  return (
    <Card className="flex flex-col h-auto sm:h-96 lg:h-[calc(100vh-120px)] overflow-hidden">
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
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{flag.name}</p>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {t("myFlags.public")}
                      </Badge>
                    </div>
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
