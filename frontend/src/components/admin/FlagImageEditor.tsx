import { useState, useRef } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Contributor {
  id: string;
  displayName: string;
}

interface FlagProperties {
  lgbt?: boolean | null;
  notRecognized?: boolean | null;
  religious?: boolean | null;
  historic?: boolean | null;
}

interface Flag {
  id: string;
  name: string;
  imageUrl: string | null;
  countryCode: string;
  subdivisionCode: string | null;
  continent: string | null;
  addedBy: { displayName: string };
  contributors: Contributor[];
  properties: FlagProperties | null;
}

const GET_ALL_FLAGS = gql`
  query GetAllFlagsAdmin {
    allFlags {
      id
      name
      imageUrl
      countryCode
      subdivisionCode
      continent
      addedBy {
        displayName
      }
      contributors {
        id
        displayName
      }
      properties {
        lgbt
        notRecognized
        religious
        historic
      }
    }
  }
`;

const GET_USERS = gql`
  query GetUsersForFlagEditor {
    users {
      id
      displayName
    }
  }
`;

const UPDATE_FLAG = gql`
  mutation UpdateFlag($id: ID!, $name: String, $imageUrl: String, $countryCode: String, $subdivisionCode: String, $continent: String, $contributorIds: [ID!], $properties: FlagPropertiesInput) {
    updateFlag(id: $id, name: $name, imageUrl: $imageUrl, countryCode: $countryCode, subdivisionCode: $subdivisionCode, continent: $continent, contributorIds: $contributorIds, properties: $properties) {
      id
      name
      imageUrl
      countryCode
      subdivisionCode
      continent
      contributors {
        id
        displayName
      }
      properties {
        lgbt
        notRecognized
        religious
        historic
      }
    }
  }
`;

const PROPERTY_LABELS: { key: keyof FlagProperties; label: string }[] = [
  { key: "lgbt", label: "LGBT+" },
  { key: "notRecognized", label: "Non riconosciuta" },
  { key: "religious", label: "Religiosa" },
  { key: "historic", label: "Storica" },
];

function FlagEditPanel({
  flag,
  allUsers,
  onSaved,
  onCancel,
}: {
  flag: Flag;
  allUsers: Contributor[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [nameInput, setNameInput] = useState(flag.name);
  const [urlInput, setUrlInput] = useState(flag.imageUrl ?? "");
  const [countryCodeInput, setCountryCodeInput] = useState(flag.countryCode);
  const [subdivisionCodeInput, setSubdivisionCodeInput] = useState(flag.subdivisionCode ?? "");
  const [continentInput, setContinentInput] = useState(flag.continent ?? "");
  const [previewUrl, setPreviewUrl] = useState(flag.imageUrl ?? "");
  const [selectedContributorIds, setSelectedContributorIds] = useState<string[]>(
    flag.contributors.map((c) => c.id)
  );
  const [properties, setProperties] = useState<FlagProperties>(flag.properties ?? {});
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [updateFlag, { loading }] = useMutation(UPDATE_FLAG, {
    onCompleted: () => { setError(null); onSaved(); },
    onError: (e) => setError(e.message),
    refetchQueries: ["GetAllFlagsAdmin", "GetFlags", "LastFlag", "GetMyFlags"],
  });

  const handleUrlChange = (val: string) => {
    setUrlInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPreviewUrl(val), 400);
  };

  const toggleContributor = (id: string) => {
    setSelectedContributorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleProperty = (key: keyof FlagProperties) => {
    setProperties((prev) => {
      const current = prev[key];
      if (current == null) return { ...prev, [key]: true };
      if (current === true) return { ...prev, [key]: false };
      return { ...prev, [key]: null };
    });
  };

  const handleSave = () => {
    if (selectedContributorIds.length === 0) {
      setError("Almeno un contributore è richiesto");
      return;
    }
    updateFlag({
      variables: {
        id: flag.id,
        name: nameInput.trim() || flag.name,
        imageUrl: urlInput.trim() || null,
        countryCode: countryCodeInput.trim() || flag.countryCode,
        subdivisionCode: subdivisionCodeInput.trim() || null,
        continent: continentInput.trim() || null,
        contributorIds: selectedContributorIds,
        properties: {
          lgbt: properties.lgbt ?? null,
          notRecognized: properties.notRecognized ?? null,
          religious: properties.religious ?? null,
          historic: properties.historic ?? null,
        },
      },
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-3 pl-4 border-l">
      {/* Preview */}
      <div className="flex justify-center pt-1">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="preview"
            className="h-20 max-w-[200px] object-contain rounded border"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }}
          />
        ) : (
          <div className="h-20 w-[200px] rounded border bg-muted flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Nessuna immagine</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Nome bandiera</Label>
        <Input value={nameInput} onChange={(e) => setNameInput(e.target.value)} autoFocus />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Codice Paese</Label>
        <Input
          placeholder="ISO 3166-1 (es. IT)"
          value={countryCodeInput}
          onChange={(e) => setCountryCodeInput(e.target.value)}
          maxLength={2}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Codice Suddivisione</Label>
        <Input
          placeholder="es. IT-LOM, US-CA"
          value={subdivisionCodeInput}
          onChange={(e) => setSubdivisionCodeInput(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Continente</Label>
        <Input
          placeholder="es. Europe, Asia, Africa…"
          value={continentInput}
          onChange={(e) => setContinentInput(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Proprietà</Label>
        <div className="flex flex-wrap gap-1.5">
          {PROPERTY_LABELS.map(({ key, label }) => {
            const val = properties[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleProperty(key)}
                className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  val === true
                    ? "bg-primary text-primary-foreground border-primary"
                    : val === false
                    ? "bg-destructive/10 text-destructive border-destructive/40 line-through"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Click: non impostato → sì → no → non impostato
        </p>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Contributori</Label>
        <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-muted/30">
          {allUsers.map((user) => {
            const selected = selectedContributorIds.includes(user.id);
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => toggleContributor(user.id)}
                className={`px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  selected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {user.displayName}
              </button>
            );
          })}
        </div>
        {selectedContributorIds.length === 0 && (
          <p className="text-xs text-destructive">Seleziona almeno un contributore</p>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-xs">URL immagine</Label>
        <Input
          placeholder="https://..."
          value={urlInput}
          onChange={(e) => handleUrlChange(e.target.value)}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 justify-end pt-1">
        <Button size="sm" onClick={handleSave} disabled={loading}>
          <Check size={14} className="mr-1" /> Salva
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={loading}>
          <X size={14} className="mr-1" /> Annulla
        </Button>
      </div>
    </div>
  );
}

export function FlagImageEditor() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, loading } = useQuery(GET_ALL_FLAGS);
  const { data: usersData } = useQuery(GET_USERS);

  const flags: Flag[] = data?.allFlags ?? [];
  const allUsers: Contributor[] = usersData?.users ?? [];

  const filtered = search.trim().length >= 2
    ? flags.filter((f) =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.addedBy.displayName.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const selectedFlag = flags.find((f) => f.id === selectedId) ?? null;
  const noImage = flags.filter((f) => !f.imageUrl);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Immagini bandiere</CardTitle>
        <CardDescription>
          Modifica le proprietà di qualsiasi bandiera nella collezione.
          {!loading && noImage.length > 0 && (
            <span className="ml-1 text-amber-600 dark:text-amber-400">
              {noImage.length} senza immagine.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`flex gap-4 ${selectedFlag ? "min-h-[600px]" : ""}`}>
          {/* Left: search + list */}
          <div className={`flex flex-col gap-3 ${selectedFlag ? "w-1/2" : "w-full"}`}>
            <Input
              placeholder="Cerca per nome bandiera o membro..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedId(null); }}
            />

            {loading && <p className="text-sm text-muted-foreground">Caricamento...</p>}

            {!loading && search.trim().length < 2 && (
              <p className="text-xs text-muted-foreground">
                Digita almeno 2 caratteri per cercare. ({flags.length} bandiere totali)
              </p>
            )}

            {!loading && search.trim().length >= 2 && filtered.length === 0 && (
              <p className="text-sm text-muted-foreground">Nessun risultato.</p>
            )}

            {filtered.length > 0 && (
              <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
                {filtered.map((flag) => {
                  const activeProps = PROPERTY_LABELS
                    .filter((p) => flag.properties?.[p.key] === true)
                    .map((p) => p.label);
                  const isSelected = flag.id === selectedId;
                  return (
                    <button
                      key={flag.id}
                      type="button"
                      onClick={() => setSelectedId(isSelected ? null : flag.id)}
                      className={`w-full text-left border rounded-lg p-2.5 flex items-center gap-3 transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "hover:bg-accent"
                      }`}
                    >
                      <div className="shrink-0 w-14 h-10 rounded border bg-muted flex items-center justify-center overflow-hidden">
                        {flag.imageUrl ? (
                          <img
                            src={flag.imageUrl}
                            alt=""
                            className="w-full h-full object-contain"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <span className="text-[9px] text-muted-foreground text-center leading-tight px-1">
                            no img
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{flag.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {flag.contributors.map((c) => c.displayName).join(", ")}
                          {flag.continent && ` · ${flag.continent}`}
                          {activeProps.length > 0 && ` · ${activeProps.join(", ")}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: edit panel */}
          {selectedFlag && (
            <div className="w-1/2">
              <FlagEditPanel
                key={selectedFlag.id}
                flag={selectedFlag}
                allUsers={allUsers}
                onSaved={() => setSelectedId(null)}
                onCancel={() => setSelectedId(null)}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
