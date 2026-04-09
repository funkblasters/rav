import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import { X, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import flagsData from "@/lib/flagsData.json";

interface FlagEntry {
  name: string;
  imageUrl: string | null;
  description: string | null;
  continent: string | null;
}

const GET_USERS = gql`
  query GetUsersForPicker {
    users {
      id
      displayName
    }
  }
`;

const GET_MY_FLAGS = gql`
  query GetMyFlagNames {
    myFlags {
      name
    }
  }
`;

const ADD_FLAG = gql`
  mutation AddFlag(
    $name: String!
    $imageUrl: String
    $acquiredAt: String!
    $isPublic: Boolean
    $description: String
    $continent: String
    $addedByUserId: ID
    $togetherWithUserIds: [ID!]
  ) {
    addFlag(
      name: $name
      imageUrl: $imageUrl
      acquiredAt: $acquiredAt
      isPublic: $isPublic
      description: $description
      continent: $continent
      addedByUserId: $addedByUserId
      togetherWithUserIds: $togetherWithUserIds
    ) {
      id
      name
      imageUrl
      acquiredAt
      isPublic
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

const allFlags = flagsData as FlagEntry[];

interface Props {
  onClose: () => void;
}

export function AddFlagModal({ onClose }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FlagEntry | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isPublic, setIsPublic] = useState(true);
  const [addedByUserId, setAddedByUserId] = useState<string>("");
  const [togetherWithUserIds, setTogetherWithUserIds] = useState<string[]>([]);
  const [togetherWithSearch, setTogetherWithSearch] = useState("");
  const [showTogetherWithDropdown, setShowTogetherWithDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const togetherWithRef = useRef<HTMLDivElement>(null);

  const { data: usersData } = useQuery(GET_USERS);
  const { data: myFlagsData } = useQuery(GET_MY_FLAGS);

  const [addFlag, { loading }] = useMutation(ADD_FLAG, {
    onCompleted: () => onClose(),
    onError: (e) => setError(e.message),
  });

  const suggestions = query.length >= 2
    ? allFlags
        .filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)
    : [];

  const handleSelect = (flag: FlagEntry) => {
    setSelected(flag);
    setQuery(flag.name);
    setShowSuggestions(false);
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSelected(null);
    setShowSuggestions(true);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
      if (
        togetherWithRef.current &&
        !togetherWithRef.current.contains(e.target as Node)
      ) {
        setShowTogetherWithDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const userFlagNames = new Set(myFlagsData?.myFlags?.map((f: { name: string }) => f.name) ?? []);
  const flagAlreadyExists = userFlagNames.has(query.trim());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = query.trim();
    if (!name || !date) return;

    if (flagAlreadyExists) {
      setError("Hai già questa bandiera nella tua collezione");
      return;
    }

    setError(null);
    const targetUserId = isAdmin && addedByUserId ? addedByUserId : undefined;
    // Refetch profile only when adding for yourself (not on behalf of another user)
    const isAddingForSelf = !targetUserId;
    addFlag({
      variables: {
        name,
        imageUrl: selected?.imageUrl ?? undefined,
        acquiredAt: date,
        isPublic,
        description: selected?.description ?? undefined,
        continent: selected?.continent ?? undefined,
        addedByUserId: targetUserId,
        togetherWithUserIds: togetherWithUserIds.length > 0 ? togetherWithUserIds : undefined,
      },
      refetchQueries: [
        "GetMyFlags",
        "TopMembers",
        "LastFlag",
        "MostWantedFlag",
        ...(isAddingForSelf ? ["MyProfile"] : []),
        ...(isPublic ? ["GetFlags"] : []),
      ],
    });
  };

  const previewUrl = selected?.imageUrl ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-background rounded-xl shadow-xl w-full max-w-md dark:border dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
          <h2 className="text-lg font-semibold">Aggiungi bandiera</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 space-y-4">

          {/* Flag name typeahead */}
          <div className="space-y-1">
            <Label>Nome *</Label>
            <div className="relative">
              <Input
                ref={inputRef}
                placeholder="Cerca una bandiera..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => query.length >= 2 && setShowSuggestions(true)}
                autoComplete="off"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-10 top-full mt-1 w-full bg-background border rounded-md shadow-md max-h-52 overflow-y-auto"
                >
                  {suggestions.map((f) => (
                    <button
                      key={f.name}
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                      onMouseDown={() => handleSelect(f)}
                    >
                      {f.imageUrl ? (
                        <img
                          src={f.imageUrl}
                          alt=""
                          className="w-7 h-5 object-cover rounded-sm shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-7 h-5 bg-muted rounded-sm shrink-0" />
                      )}
                      <span className="truncate">{f.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Flag preview */}
          <div className="flex justify-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={selected?.name}
                className="h-20 max-w-[180px] object-contain rounded border"
              />
            ) : (
              <div className="h-20 w-[180px] rounded border bg-muted flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Anteprima bandiera</span>
              </div>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1">
            <Label>Data acquisizione *</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Admin: user picker */}
          {isAdmin && usersData?.users?.length > 0 && (
            <div className="space-y-1">
              <Label>Aggiunta da</Label>
              <select
                value={addedByUserId}
                onChange={(e) => setAddedByUserId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">— me stesso —</option>
                {usersData.users.map((u: { id: string; displayName: string }) => (
                  <option key={u.id} value={u.id}>{u.displayName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Together with: user picker (optional) */}
          <div className="space-y-2">
            <Label>Insieme a <span className="text-muted-foreground">(opzionale)</span></Label>
            <div className="space-y-2">
              {/* Selected users as badges */}
              {togetherWithUserIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {togetherWithUserIds.map((userId) => {
                    const selectedUser = usersData?.users?.find((u: { id: string; displayName: string }) => u.id === userId);
                    return (
                      <Badge key={userId} variant="secondary" className="gap-1">
                        {selectedUser?.displayName}
                        <button
                          type="button"
                          onClick={() => setTogetherWithUserIds(togetherWithUserIds.filter((id) => id !== userId))}
                          className="ml-1 hover:text-destructive"
                        >
                          <X size={14} />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}

              {/* Combobox dropdown */}
              <div ref={togetherWithRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowTogetherWithDropdown(!showTogetherWithDropdown)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-ring hover:bg-accent/50 transition-colors"
                >
                  <input
                    type="text"
                    placeholder="Cerca un membro..."
                    value={togetherWithSearch}
                    onChange={(e) => setTogetherWithSearch(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                  />
                  <ChevronDown size={16} className="text-muted-foreground shrink-0" />
                </button>

                {showTogetherWithDropdown && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-background border rounded-md shadow-md max-h-64 overflow-y-auto">
                    {usersData?.users ? (
                      usersData.users
                        .filter((u: { id: string; displayName: string }) => u.id !== user?.id)
                        .filter((u: { id: string; displayName: string }) =>
                          u.displayName.toLowerCase().includes(togetherWithSearch.toLowerCase())
                        )
                        .map((u: { id: string; displayName: string }) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              if (togetherWithUserIds.includes(u.id)) {
                                setTogetherWithUserIds(togetherWithUserIds.filter((id) => id !== u.id));
                              } else {
                                setTogetherWithUserIds([...togetherWithUserIds, u.id]);
                              }
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                          >
                            {togetherWithUserIds.includes(u.id) && <Check size={16} className="text-primary shrink-0" />}
                            {!togetherWithUserIds.includes(u.id) && <div className="w-4 shrink-0" />}
                            <span>{u.displayName}</span>
                          </button>
                        ))
                    ) : (
                      <p className="px-3 py-2 text-xs text-muted-foreground">Caricamento utenti...</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Public / Secret toggle */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
                isPublic ? "bg-primary" : "bg-muted-foreground/40"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  isPublic ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm">
              {isPublic ? (
                <span className="font-medium">Pubblica</span>
              ) : (
                <span className="text-muted-foreground">Segreta (visibile solo a te)</span>
              )}
            </span>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading || !query.trim() || !date}>
              Aggiungi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
