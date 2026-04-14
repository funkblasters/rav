import { useState, useRef } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClubRoleBadge } from "@/components/ClubRoleBadge";
import { MostWantedAdmin } from "@/components/dashboard/MostWantedAdmin";
import { FeaturedNewsAdmin } from "@/components/dashboard/FeaturedNewsAdmin";
import { FlagImageEditor } from "@/components/admin/FlagImageEditor";
import { tokenStore } from "@/lib/tokenStore";

const CLUB_ROLES = [
  "ORDINARY_ASSOCIATE",
  "SECRETARY",
  "TREASURER",
  "VICE_CHAIRMAN",
  "HONORARY_CHAIRMAN",
  "CHAIRMAN",
] as const;

type ClubRole = typeof CLUB_ROLES[number];
type UserStatus = "REGISTERED" | "PENDING" | "EXTERNAL";

interface User {
  id: string;
  email?: string | null;
  displayName: string;
  role: string;
  clubRole: string;
  cardNumber?: string | null;
  status: UserStatus;
}

interface Invite {
  email: string;
  clubRole: string;
  cardNumber?: string;
}

interface ImportFlagError {
  row: number;
  flagName: string;
  reason: string;
}

interface ImportFlagsResult {
  flagsImported: number;
  usersCreated: number;
  errors: ImportFlagError[];
}

interface FailedImport {
  id: string;
  row: number;
  flagName: string;
  reason: string;
  rawData: string;
  createdAt: string;
}

// ── GraphQL ──────────────────────────────────────────────────────────────────

const GET_PANEL = gql`
  query GetAdminPanel {
    adminUsers {
      id
      email
      displayName
      role
      clubRole
      cardNumber
      status
    }
    invites {
      email
      clubRole
      cardNumber
    }
    failedImports {
      id
      row
      flagName
      reason
      rawData
      createdAt
    }
  }
`;

const ADD_INVITE = gql`
  mutation AddInvite($email: String!, $clubRole: ClubRole!, $cardNumber: String) {
    addInvite(email: $email, clubRole: $clubRole, cardNumber: $cardNumber) {
      email
      clubRole
      cardNumber
    }
  }
`;

const REMOVE_INVITE = gql`
  mutation RemoveInvite($email: String!) {
    removeInvite(email: $email)
  }
`;

const RESET_PASSWORD = gql`
  mutation ResetUserPassword($userId: ID!, $newPassword: String!) {
    resetUserPassword(userId: $userId, newPassword: $newPassword)
  }
`;

const ASSIGN_EXTERNAL_EMAIL = gql`
  mutation AssignExternalEmail($userId: ID!, $email: String!) {
    assignExternalEmail(userId: $userId, email: $email) {
      id
      email
      displayName
      status
    }
  }
`;

const CLEAR_FAILED_IMPORT = gql`
  mutation ClearFailedImport($id: ID!) {
    clearFailedImport(id: $id)
  }
`;

const CLEAR_ALL_FAILED_IMPORTS = gql`
  mutation ClearAllFailedImports {
    clearAllFailedImports
  }
`;

// ── Small helpers ─────────────────────────────────────────────────────────────

const emptyInviteForm = {
  email: "",
  clubRole: "ORDINARY_ASSOCIATE" as ClubRole,
  cardNumber: "",
};

function StatusBadge({ status }: { status: UserStatus }) {
  if (status === "PENDING")
    return <Badge variant="outline" className="text-yellow-600 border-yellow-400">Pending</Badge>;
  if (status === "EXTERNAL")
    return <Badge variant="outline" className="text-blue-600 border-blue-400">External</Badge>;
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminPage() {
  const { t } = useTranslation();

  // invite form
  const [inviteForm, setInviteForm] = useState(emptyInviteForm);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // per-user password reset
  const [resetForms, setResetForms] = useState<Record<string, string>>({});
  const [resetErrors, setResetErrors] = useState<Record<string, string>>({});

  // per-user assign-email (external members)
  const [assignForms, setAssignForms] = useState<Record<string, string>>({});
  const [assignErrors, setAssignErrors] = useState<Record<string, string>>({});

  // import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportFlagsResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(GET_PANEL);

  const [addInvite, { loading: adding }] = useMutation(ADD_INVITE, {
    refetchQueries: [GET_PANEL],
    onCompleted: () => { setInviteForm(emptyInviteForm); setInviteError(null); },
    onError: (e) => setInviteError(e.message),
  });

  const [removeInvite] = useMutation(REMOVE_INVITE, { refetchQueries: [GET_PANEL] });

  const [resetPassword] = useMutation(RESET_PASSWORD, {
    onCompleted: (_, opts) => {
      const uid = opts?.variables?.userId as string;
      setResetForms((f) => { const n = { ...f }; delete n[uid]; return n; });
      setResetErrors((e) => { const n = { ...e }; delete n[uid]; return n; });
    },
    onError: (e, opts) => {
      const uid = opts?.variables?.userId as string;
      setResetErrors((p) => ({ ...p, [uid]: e.message }));
    },
  });

  const [assignExternalEmail] = useMutation(ASSIGN_EXTERNAL_EMAIL, {
    refetchQueries: [GET_PANEL],
    onCompleted: (_, opts) => {
      const uid = opts?.variables?.userId as string;
      setAssignForms((f) => { const n = { ...f }; delete n[uid]; return n; });
      setAssignErrors((e) => { const n = { ...e }; delete n[uid]; return n; });
    },
    onError: (e, opts) => {
      const uid = opts?.variables?.userId as string;
      setAssignErrors((p) => ({ ...p, [uid]: e.message }));
    },
  });

  const [clearFailedImport] = useMutation(CLEAR_FAILED_IMPORT, { refetchQueries: [GET_PANEL] });
  const [clearAllFailedImports] = useMutation(CLEAR_ALL_FAILED_IMPORTS, { refetchQueries: [GET_PANEL] });

  // ── Derived data ────────────────────────────────────────────────────────────
  const allUsers: User[] = data?.adminUsers ?? [];
  const registeredUsers = allUsers.filter((u) => u.status === "REGISTERED");
  const pendingUsers = allUsers.filter((u) => u.status === "PENDING");
  const externalUsers = allUsers.filter((u) => u.status === "EXTERNAL");
  const failedImports: FailedImport[] = data?.failedImports ?? [];

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email);
  const formatClubRole = (role: string) => t(`profile.clubRoles.${role}`, { defaultValue: role });

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEmailValid) return;
    addInvite({
      variables: {
        email: inviteForm.email,
        clubRole: inviteForm.clubRole,
        cardNumber: inviteForm.cardNumber.trim() || undefined,
      },
    });
  };

  const toggleResetForm = (uid: string) => {
    setResetForms((f) => { const n = { ...f }; if (uid in n) delete n[uid]; else n[uid] = ""; return n; });
    setResetErrors((e) => { const n = { ...e }; delete n[uid]; return n; });
  };

  const handleResetSubmit = (e: React.FormEvent, uid: string) => {
    e.preventDefault();
    const pw = resetForms[uid] ?? "";
    if (pw.length < 6) {
      setResetErrors((p) => ({ ...p, [uid]: "Password must be at least 6 characters" }));
      return;
    }
    resetPassword({ variables: { userId: uid, newPassword: pw } });
  };

  const toggleAssignForm = (uid: string) => {
    setAssignForms((f) => { const n = { ...f }; if (uid in n) delete n[uid]; else n[uid] = ""; return n; });
    setAssignErrors((e) => { const n = { ...e }; delete n[uid]; return n; });
  };

  const handleAssignSubmit = (e: React.FormEvent, uid: string) => {
    e.preventDefault();
    const email = (assignForms[uid] ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAssignErrors((p) => ({ ...p, [uid]: "Enter a valid email address" }));
      return;
    }
    assignExternalEmail({ variables: { userId: uid, email } });
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    const token = tokenStore.get();
    if (!token) { setImportError("Not authenticated"); return; }

    setImportLoading(true);
    setImportResult(null);
    setImportError(null);

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      const res = await fetch("/api/import-flags", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setImportError(json.error ?? "Import failed");
      } else {
        setImportResult(json as ImportFlagsResult);
        setImportFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        refetch();
      }
    } catch {
      setImportError("Network error — could not reach the server");
    } finally {
      setImportLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="pb-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground text-sm">Manage club members, imports, and flag content</p>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">
            Members
            {pendingUsers.length + externalUsers.length > 0 && (
              <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5">
                {pendingUsers.length + externalUsers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="import">
            Import
            {failedImports.length > 0 && (
              <span className="ml-1.5 text-xs bg-destructive/20 text-destructive rounded-full px-1.5">
                {failedImports.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="flags">Flags</TabsTrigger>
        </TabsList>

        {/* ── MEMBERS TAB ── */}
        <TabsContent value="members" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl">
            <div className="space-y-6">

              {/* Registered members */}
              <Card>
                <CardHeader>
                  <CardTitle>Registered Members</CardTitle>
                  <CardDescription>Accounts with full access</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : registeredUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No registered members yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {registeredUsers.map((u) => (
                        <div key={u.id} className="border rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <span className="font-mono text-xs text-muted-foreground shrink-0">
                                {u.cardNumber ?? "—"}
                              </span>
                              <span className="font-medium truncate">{u.displayName}</span>
                              <span className="text-sm text-muted-foreground truncate">{u.email}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <ClubRoleBadge role={u.clubRole} />
                              <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                                {u.role}
                              </Badge>
                              <Button variant="ghost" size="sm" onClick={() => toggleResetForm(u.id)}>
                                {u.id in resetForms ? "Cancel" : "Reset password"}
                              </Button>
                            </div>
                          </div>
                          {u.id in resetForms && (
                            <form onSubmit={(e) => handleResetSubmit(e, u.id)} className="flex items-end gap-2 pt-1 border-t">
                              <div className="flex-1 space-y-1">
                                <Label className="text-xs">New password</Label>
                                <Input
                                  type="password"
                                  placeholder="Min. 6 characters"
                                  value={resetForms[u.id]}
                                  onChange={(e) => setResetForms((f) => ({ ...f, [u.id]: e.target.value }))}
                                />
                                {resetErrors[u.id] && (
                                  <p className="text-xs text-destructive">{resetErrors[u.id]}</p>
                                )}
                              </div>
                              <Button type="submit" size="sm" variant="destructive">Set password</Button>
                            </form>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending members (imported with email) */}
              {!loading && pendingUsers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Members</CardTitle>
                    <CardDescription>
                      Imported from Excel — their flags and stats are already live. They become full members once they register with their email.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {pendingUsers.map((u) => (
                        <div key={u.id} className="border rounded-lg p-3 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="font-medium truncate">{u.displayName}</span>
                            <span className="text-sm text-muted-foreground truncate">{u.email}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <ClubRoleBadge role={u.clubRole} />
                            <StatusBadge status="PENDING" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* External members (name-only) */}
              {!loading && (
                <Card>
                  <CardHeader>
                    <CardTitle>External Members</CardTitle>
                    <CardDescription>
                      Members without an account. Their stats appear in rankings. Assign an email if they ever want to join.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {externalUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No external members.</p>
                    ) : (
                      <div className="space-y-3">
                        {externalUsers.map((u) => (
                          <div key={u.id} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-medium truncate">{u.displayName}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <ClubRoleBadge role={u.clubRole} />
                                <StatusBadge status="EXTERNAL" />
                                <Button variant="ghost" size="sm" onClick={() => toggleAssignForm(u.id)}>
                                  {u.id in assignForms ? "Cancel" : "Assign email"}
                                </Button>
                              </div>
                            </div>
                            {u.id in assignForms && (
                              <form onSubmit={(e) => handleAssignSubmit(e, u.id)} className="flex items-end gap-2 pt-1 border-t">
                                <div className="flex-1 space-y-1">
                                  <Label className="text-xs">Email address</Label>
                                  <Input
                                    type="email"
                                    placeholder="member@example.com"
                                    value={assignForms[u.id]}
                                    onChange={(e) => setAssignForms((f) => ({ ...f, [u.id]: e.target.value }))}
                                  />
                                  {assignErrors[u.id] && (
                                    <p className="text-xs text-destructive">{assignErrors[u.id]}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    They'll appear as Pending until they register.
                                  </p>
                                </div>
                                <Button type="submit" size="sm">Assign</Button>
                              </form>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Pending invites */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Pending Invites</CardTitle>
                <CardDescription>
                  Only these email addresses can register. Club role and card number are applied on sign-up.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleInviteSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1 sm:col-span-1">
                      <Label htmlFor="inv-email">Email</Label>
                      <Input
                        id="inv-email"
                        type="email"
                        placeholder="member@example.com"
                        value={inviteForm.email}
                        onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="inv-role">Club role</Label>
                      <select
                        id="inv-role"
                        value={inviteForm.clubRole}
                        onChange={(e) => setInviteForm((f) => ({ ...f, clubRole: e.target.value as ClubRole }))}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        {CLUB_ROLES.map((r) => (
                          <option key={r} value={r}>{formatClubRole(r)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="inv-card">
                        Card number <span className="text-muted-foreground">(optional)</span>
                      </Label>
                      <Input
                        id="inv-card"
                        placeholder="RAV-0042"
                        value={inviteForm.cardNumber}
                        onChange={(e) => setInviteForm((f) => ({ ...f, cardNumber: e.target.value }))}
                      />
                    </div>
                  </div>
                  {inviteError && <p className="text-xs text-destructive">{inviteError}</p>}
                  <Button type="submit" disabled={adding || !isEmailValid}>Add invite</Button>
                </form>

                {!loading && (
                  data?.invites.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending invites.</p>
                  ) : (
                    <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                      <table className="w-full text-sm min-w-min">
                        <thead>
                          <tr className="text-left text-muted-foreground border-b">
                            <th className="pb-2 font-medium">Email</th>
                            <th className="pb-2 font-medium">Club role</th>
                            <th className="pb-2 font-medium">Card</th>
                            <th className="pb-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {data?.invites.map((inv: Invite) => (
                            <tr key={inv.email} className="border-b last:border-0">
                              <td className="py-2">{inv.email}</td>
                              <td className="py-2"><ClubRoleBadge role={inv.clubRole} /></td>
                              <td className="py-2 font-mono text-muted-foreground">
                                {inv.cardNumber ?? <span className="italic">auto</span>}
                              </td>
                              <td className="py-2 text-right">
                                <Button
                                  variant="ghost" size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => removeInvite({ variables: { email: inv.email } })}
                                >
                                  Remove
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── IMPORT TAB ── */}
        <TabsContent value="import" className="space-y-6 mt-4 max-w-3xl">

          {/* Upload card */}
          <Card>
            <CardHeader>
              <CardTitle>Import Flags from Excel</CardTitle>
              <CardDescription>
                Upload an <span className="font-mono text-xs">.xlsx</span> file with columns:{" "}
                <span className="font-mono text-xs">flag, date, contributors, continent, is_variant</span>.
                Contributors can be emails or plain names, comma-separated.
                Images are matched automatically from the flag database.
                Year-only dates (e.g. <span className="font-mono text-xs">2020</span>) default to Jan 1 of that year.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleImport} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="import-file">Excel file (.xlsx)</Label>
                  <Input
                    id="import-file"
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      setImportFile(e.target.files?.[0] ?? null);
                      setImportResult(null);
                      setImportError(null);
                    }}
                  />
                </div>
                {importError && <p className="text-sm text-destructive">{importError}</p>}
                <Button type="submit" disabled={!importFile || importLoading}>
                  {importLoading ? "Importing…" : "Import"}
                </Button>
              </form>

              {importResult && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex gap-4 text-sm flex-wrap">
                    <span className="text-green-600 font-medium">
                      {importResult.flagsImported} flag{importResult.flagsImported !== 1 ? "s" : ""} imported
                    </span>
                    <span className="text-blue-600 font-medium">
                      {importResult.usersCreated} user{importResult.usersCreated !== 1 ? "s" : ""} created
                    </span>
                    {importResult.errors.length > 0 && (
                      <span className="text-destructive font-medium">
                        {importResult.errors.length} error{importResult.errors.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {importResult.errors.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Errors are saved below so you can review and add them manually.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Persisted failed imports */}
          {!loading && failedImports.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle>Failed Rows</CardTitle>
                    <CardDescription className="mt-1">
                      These rows could not be imported. Review them and add the flags manually, then dismiss.
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={() => clearAllFailedImports()}
                  >
                    Dismiss all
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {failedImports.map((fi) => {
                    interface RawData { date?: string | null; contributors?: string[]; continent?: string | null; }
                    let parsed: RawData = {};
                    try { parsed = JSON.parse(fi.rawData) as RawData; } catch { /* noop */ }
                    return (
                      <div key={fi.id} className="border rounded-lg p-3 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs text-muted-foreground">row {fi.row}</span>
                              <span className="font-medium text-sm">{fi.flagName}</span>
                            </div>
                            <p className="text-xs text-destructive">{fi.reason}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground shrink-0"
                            onClick={() => clearFailedImport({ variables: { id: fi.id } })}
                          >
                            Dismiss
                          </Button>
                        </div>
                        {Object.keys(parsed).length > 0 && (
                          <div className="text-xs text-muted-foreground bg-muted/40 rounded p-2 space-y-0.5">
                            {parsed.date != null && <div><span className="font-medium">Date:</span> {String(parsed.date)}</div>}
                            {Array.isArray(parsed.contributors) && parsed.contributors.length > 0 && (
                              <div><span className="font-medium">Contributors:</span> {(parsed.contributors as string[]).join(", ")}</div>
                            )}
                            {parsed.continent && <div><span className="font-medium">Continent:</span> {String(parsed.continent)}</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && failedImports.length === 0 && (
            <p className="text-sm text-muted-foreground">No failed imports.</p>
          )}
        </TabsContent>

        {/* ── FLAGS TAB ── */}
        <TabsContent value="flags" className="mt-4">
          <div className="space-y-6 max-w-xl">
            <MostWantedAdmin />
            <FeaturedNewsAdmin />
            <FlagImageEditor />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
