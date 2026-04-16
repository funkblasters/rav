import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";

const GET_FEATURED_NEWS = gql`
  query GetFeaturedNews {
    featuredNewsItem {
      title
      link
      imageUrl
      body
    }
  }
`;

const SET_FEATURED_NEWS = gql`
  mutation SetFeaturedNews($title: String!, $link: String!, $imageUrl: String, $body: String) {
    setFeaturedNews(title: $title, link: $link, imageUrl: $imageUrl, body: $body) {
      title
      link
      pubDate
      imageUrl
      body
    }
  }
`;

const CLEAR_FEATURED_NEWS = gql`
  mutation ClearFeaturedNews {
    clearFeaturedNews
  }
`;

const emptyForm = { title: "", link: "", imageUrl: "", body: "" };

export function FeaturedNewsAdmin() {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const { data, loading } = useQuery(GET_FEATURED_NEWS);
  const current = data?.featuredNewsItem;

  const refetch = { refetchQueries: [GET_FEATURED_NEWS] };

  const [setFeaturedNews, { loading: saving }] = useMutation(SET_FEATURED_NEWS, {
    ...refetch,
    onCompleted: () => { setForm(emptyForm); setError(null); },
    onError: (e) => setError(getErrorMessage(e)),
  });

  const [clearFeaturedNews, { loading: clearing }] = useMutation(CLEAR_FEATURED_NEWS, {
    ...refetch,
    onError: (e) => setError(getErrorMessage(e)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeaturedNews({
      variables: {
        title: form.title,
        link: form.link,
        imageUrl: form.imageUrl.trim() || undefined,
        body: form.body.trim() || undefined,
      },
    });
  };

  const field = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Featured News</CardTitle>
        <CardDescription>
          Highlight a news item to appear at the top of the news section with a featured layout.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Current value */}
        {!loading && current && (
          <div className="flex items-start justify-between gap-4 p-3 border rounded-lg bg-muted/30">
            <div className="flex gap-3 min-w-0 flex-1">
              {current.imageUrl && (
                <img
                  src={current.imageUrl}
                  alt={current.title}
                  className="w-16 h-10 object-cover rounded shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm line-clamp-2">{current.title}</p>
                <a
                  href={current.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline truncate block mt-1"
                >
                  {current.link}
                </a>
                {current.body && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{current.body}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2 shrink-0">
              <a
                href={current.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                <ExternalLink size={16} />
              </a>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={clearing}
                onClick={() => clearFeaturedNews()}
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Set form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="fn-title">Title *</Label>
            <Input
              id="fn-title"
              placeholder="Breaking flag news headline"
              value={form.title}
              onChange={field("title")}
              required
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="fn-link">Link *</Label>
            <Input
              id="fn-link"
              type="url"
              placeholder="https://…"
              value={form.link}
              onChange={field("link")}
              required
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="fn-image">Image URL</Label>
            <Input
              id="fn-image"
              type="url"
              placeholder="https://…"
              value={form.imageUrl}
              onChange={field("imageUrl")}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="fn-body">Body Text</Label>
            <textarea
              id="fn-body"
              placeholder="Brief description or summary…"
              value={form.body}
              onChange={field("body")}
              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={3}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" disabled={saving || !form.title || !form.link}>
            {current ? "Update" : "Set"} Featured News
          </Button>
        </form>

      </CardContent>
    </Card>
  );
}
