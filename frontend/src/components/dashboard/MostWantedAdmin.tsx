import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const GET_MOST_WANTED = gql`
  query GetMostWanted {
    mostWantedFlag {
      id
      name
      imageUrl
      acquiredAt
      description
    }
  }
`;

const SET_MOST_WANTED = gql`
  mutation SetMostWanted(
    $name: String!
    $imageUrl: String
    $acquiredAt: String!
    $description: String
  ) {
    setMostWanted(
      name: $name
      imageUrl: $imageUrl
      acquiredAt: $acquiredAt
      description: $description
    ) {
      id
      name
      imageUrl
      acquiredAt
      description
    }
  }
`;

const CLEAR_MOST_WANTED = gql`
  mutation ClearMostWanted {
    clearMostWanted
  }
`;

const emptyForm = { name: "", imageUrl: "", acquiredAt: "", description: "" };

export function MostWantedAdmin() {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const { data, loading } = useQuery(GET_MOST_WANTED);
  const current = data?.mostWantedFlag;

  const refetch = { refetchQueries: [GET_MOST_WANTED] };

  const [setMostWanted, { loading: saving }] = useMutation(SET_MOST_WANTED, {
    ...refetch,
    onCompleted: () => { setForm(emptyForm); setError(null); },
    onError: (e) => setError(e.message),
  });

  const [clearMostWanted, { loading: clearing }] = useMutation(CLEAR_MOST_WANTED, {
    ...refetch,
    onError: (e) => setError(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMostWanted({
      variables: {
        name: form.name,
        imageUrl: form.imageUrl.trim() || undefined,
        acquiredAt: form.acquiredAt,
        description: form.description.trim() || undefined,
      },
    });
  };

  const field = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Most Wanted Flag</CardTitle>
        <CardDescription>
          Override what appears in the "Most Wanted" card on the dashboard. Leave unset to fall back
          to the oldest flag in the collection.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Current value */}
        {!loading && current && (
          <div className="flex items-start justify-between gap-4 p-3 border rounded-lg bg-muted/30">
            <div className="flex gap-3 min-w-0">
              {current.imageUrl && (
                <img
                  src={current.imageUrl}
                  alt={current.name}
                  className="w-12 h-8 object-cover rounded shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{current.name}</p>
                {current.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{current.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(current.acquiredAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive shrink-0"
              disabled={clearing}
              onClick={() => clearMostWanted()}
            >
              Clear
            </Button>
          </div>
        )}

        {/* Set form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="mw-name">Name *</Label>
              <Input
                id="mw-name"
                placeholder="Flag of Somewhere"
                value={form.name}
                onChange={field("name")}
                required
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="mw-image">Image URL</Label>
              <Input
                id="mw-image"
                type="url"
                placeholder="https://…"
                value={form.imageUrl}
                onChange={field("imageUrl")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mw-date">Date *</Label>
              <Input
                id="mw-date"
                type="date"
                value={form.acquiredAt}
                onChange={field("acquiredAt")}
                required
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="mw-desc">Description</Label>
              <textarea
                id="mw-desc"
                rows={3}
                placeholder="Why this flag is so sought after…"
                value={form.description}
                onChange={field("description")}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" disabled={saving || !form.name || !form.acquiredAt}>
            {current ? "Update" : "Set"} Most Wanted
          </Button>
        </form>

      </CardContent>
    </Card>
  );
}
