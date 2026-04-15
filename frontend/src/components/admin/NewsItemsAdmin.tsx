import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { Trash2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface NewsItem {
  id: string;
  title: string;
  link: string;
  imageUrl?: string | null;
  source?: string | null;
  pubDate: string;
}

const GET_NEWS_ITEMS = gql`
  query NewsItemsAdmin {
    newsItems {
      id
      title
      link
      imageUrl
      source
      pubDate
    }
  }
`;

const CREATE_NEWS_ITEM = gql`
  mutation CreateNewsItem(
    $title: String!
    $link: String!
    $imageUrl: String
    $source: String
    $pubDate: String!
  ) {
    createNewsItem(title: $title, link: $link, imageUrl: $imageUrl, source: $source, pubDate: $pubDate) {
      id
      title
      link
      imageUrl
      source
      pubDate
    }
  }
`;

const DELETE_NEWS_ITEM = gql`
  mutation DeleteNewsItem($id: ID!) {
    deleteNewsItem(id: $id)
  }
`;

const emptyForm = { title: "", link: "", imageUrl: "", source: "", pubDate: "" };

export function NewsItemsAdmin() {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data, loading } = useQuery(GET_NEWS_ITEMS);
  const items: NewsItem[] = data?.newsItems ?? [];

  const refetchQ = { refetchQueries: ["NewsItemsAdmin", "NewsItems"] };

  const [createNewsItem, { loading: creating }] = useMutation(CREATE_NEWS_ITEM, {
    ...refetchQ,
    onCompleted: () => { setForm(emptyForm); setError(null); },
    onError: (e) => setError(e.message),
  });

  const [deleteNewsItem, { loading: deleting }] = useMutation(DELETE_NEWS_ITEM, {
    ...refetchQ,
    onCompleted: () => setConfirmId(null),
  });

  const field = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createNewsItem({
      variables: {
        title: form.title,
        link: form.link,
        imageUrl: form.imageUrl.trim() || undefined,
        source: form.source.trim() || undefined,
        pubDate: form.pubDate,
      },
    });
  };

  const canSubmit = form.title.trim() && form.link.trim() && form.pubDate;

  return (
    <div className="space-y-6">
      {/* Add form */}
      <Card>
        <CardHeader>
          <CardTitle>Add News Item</CardTitle>
          <CardDescription>
            News items appear in the feed on the dashboard, ordered by date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="ni-title">Title *</Label>
                <Input
                  id="ni-title"
                  placeholder="Flag of the year awarded to…"
                  value={form.title}
                  onChange={field("title")}
                  required
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="ni-link">Link *</Label>
                <Input
                  id="ni-link"
                  type="url"
                  placeholder="https://…"
                  value={form.link}
                  onChange={field("link")}
                  required
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="ni-image">Thumbnail URL</Label>
                <Input
                  id="ni-image"
                  type="url"
                  placeholder="https://… (links to image)"
                  value={form.imageUrl}
                  onChange={field("imageUrl")}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ni-source">Source</Label>
                <Input
                  id="ni-source"
                  placeholder="Vexillology Today"
                  value={form.source}
                  onChange={field("source")}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ni-date">Date *</Label>
                <Input
                  id="ni-date"
                  type="date"
                  value={form.pubDate}
                  onChange={field("pubDate")}
                  required
                />
              </div>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" disabled={creating || !canSubmit}>
              {creating ? "Adding…" : "Add News Item"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing items */}
      <Card>
        <CardHeader>
          <CardTitle>Published Items</CardTitle>
          <CardDescription>{items.length} item{items.length !== 1 ? "s" : ""} in the feed</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No news items yet.</p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border rounded-lg p-2">
                  {/* Thumbnail */}
                  <div className="w-14 h-9 shrink-0 rounded overflow-hidden bg-muted flex items-center justify-center">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[9px] text-muted-foreground">no img</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.source && <span>{item.source} · </span>}
                      {new Date(item.pubDate).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink size={14} />
                    </a>
                    {confirmId === item.id ? (
                      <>
                        <span className="text-xs text-destructive font-medium">Sure?</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deleting}
                          onClick={() => deleteNewsItem({ variables: { id: item.id } })}
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
                      </>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setConfirmId(item.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
