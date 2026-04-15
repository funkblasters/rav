import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Flag {
  id: string;
  name: string;
  imageUrl: string | null;
  contributors: { id: string; displayName: string }[];
}

const GET_ALL_FLAGS = gql`
  query GetAllFlagsAdmin {
    allFlags {
      id
      name
      imageUrl
      contributors {
        id
        displayName
      }
    }
  }
`;

const DELETE_FLAG = gql`
  mutation DeleteFlag($id: ID!) {
    deleteFlag(id: $id)
  }
`;

export function DeleteFlagCard() {
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, loading } = useQuery(GET_ALL_FLAGS);
  const [deleteFlag, { loading: deleting }] = useMutation(DELETE_FLAG, {
    refetchQueries: ["GetAllFlagsAdmin"],
    onCompleted: () => setConfirmId(null),
  });

  const allFlags: Flag[] = data?.allFlags ?? [];

  const filtered = search.trim()
    ? allFlags.filter((f) =>
        f.name.toLowerCase().includes(search.trim().toLowerCase())
      )
    : allFlags;

  const handleDelete = (id: string) => {
    deleteFlag({ variables: { id } });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delete Flag</CardTitle>
        <CardDescription>
          Permanently removes a flag and all its contributor associations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Search flags…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setConfirmId(null); }}
        />

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No flags found.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filtered.map((flag) => (
              <div
                key={flag.id}
                className="flex items-center gap-3 border rounded-lg p-2"
              >
                {/* Thumbnail */}
                <div className="w-12 h-8 shrink-0 rounded overflow-hidden bg-muted flex items-center justify-center">
                  {flag.imageUrl ? (
                    <img
                      src={flag.imageUrl}
                      alt={flag.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[8px] text-muted-foreground text-center leading-tight px-0.5">
                      {flag.name}
                    </span>
                  )}
                </div>

                {/* Name + contributors */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{flag.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {flag.contributors.map((c) => c.displayName).join(", ")}
                  </p>
                </div>

                {/* Delete / Confirm */}
                {confirmId === flag.id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-destructive font-medium">Sure?</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deleting}
                      onClick={() => handleDelete(flag.id)}
                    >
                      Delete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={deleting}
                      onClick={() => setConfirmId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmId(flag.id)}
                  >
                    <Trash2 size={15} />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
