import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClubRoleBadge } from "@/components/ClubRoleBadge";
import { MostWantedAdmin } from "@/components/dashboard/MostWantedAdmin";

const CLUB_ROLES = [
  "ORDINARY_ASSOCIATE",
  "SECRETARY",
  "TREASURER",
  "VICE_CHAIRMAN",
  "HONORARY_CHAIRMAN",
  "CHAIRMAN",
] as const;

type ClubRole = typeof CLUB_ROLES[number];

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  clubRole: string;
  cardNumber: string;
}

interface Invite {
  email: string;
  clubRole: string;
  cardNumber?: string;
}

const GET_PANEL = gql`
  query GetAdminPanel {
    users {
      id
      email
      displayName
      role
      clubRole
      cardNumber
    }
    invites {
      email
      clubRole
      cardNumber
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

const emptyInviteForm = {
  email: "",
  clubRole: "ORDINARY_ASSOCIATE" as ClubRole,
  cardNumber: "",
};

export function AdminPage() {
  const { t } = useTranslation();
  const [inviteForm, setInviteForm] = useState(emptyInviteForm);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Per-user reset password state: userId → new password input
  const [resetForms, setResetForms] = useState<Record<string, string>>({});
  const [resetErrors, setResetErrors] = useState<Record<string, string>>({});

  const { data, loading } = useQuery(GET_PANEL);

  const [addInvite, { loading: adding }] = useMutation(ADD_INVITE, {
    refetchQueries: [GET_PANEL],
    onCompleted: () => { setInviteForm(emptyInviteForm); setInviteError(null); },
    onError: (e) => setInviteError(e.message),
  });

  const [removeInvite] = useMutation(REMOVE_INVITE, {
    refetchQueries: [GET_PANEL],
  });

  const [resetPassword] = useMutation(RESET_PASSWORD, {
    onCompleted: (_, opts) => {
      const userId = opts?.variables?.userId as string;
      setResetForms((f) => { const n = { ...f }; delete n[userId]; return n; });
      setResetErrors((e) => { const n = { ...e }; delete n[userId]; return n; });
    },
    onError: (e, opts) => {
      const userId = opts?.variables?.userId as string;
      setResetErrors((prev) => ({ ...prev, [userId]: e.message }));
    },
  });

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteForm.email);

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

  const toggleResetForm = (userId: string) => {
    setResetForms((f) => {
      const next = { ...f };
      if (userId in next) {
        delete next[userId];
      } else {
        next[userId] = "";
      }
      return next;
    });
    setResetErrors((e) => { const n = { ...e }; delete n[userId]; return n; });
  };

  const handleResetSubmit = (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    const newPassword = resetForms[userId] ?? "";
    if (newPassword.length < 6) {
      setResetErrors((prev) => ({ ...prev, [userId]: "Password must be at least 6 characters" }));
      return;
    }
    resetPassword({ variables: { userId, newPassword } });
  };

  const formatClubRole = (role: string) =>
    t(`profile.clubRoles.${role}`, { defaultValue: role });

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground text-sm">Manage club members and invitations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl">
        {/* ── Left column: User stuff ── */}
        <div className="space-y-8">
          {/* Registered members */}
          <Card>
            <CardHeader>
              <CardTitle>Registered Members</CardTitle>
              <CardDescription>All accounts currently in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : data?.users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members yet.</p>
              ) : (
                <div className="space-y-3">
                  {data?.users.map((u: User) => (
                    <div key={u.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <span className="font-mono text-xs text-muted-foreground shrink-0">
                            {u.cardNumber}
                          </span>
                          <span className="font-medium truncate">{u.displayName}</span>
                          <span className="text-sm text-muted-foreground truncate">{u.email}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <ClubRoleBadge role={u.clubRole} />
                          <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                            {u.role}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleResetForm(u.id)}
                          >
                            {u.id in resetForms ? "Cancel" : "Reset password"}
                          </Button>
                        </div>
                      </div>

                      {u.id in resetForms && (
                        <form
                          onSubmit={(e) => handleResetSubmit(e, u.id)}
                          className="flex items-end gap-2 pt-1 border-t"
                        >
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">New password</Label>
                            <Input
                              type="password"
                              placeholder="Min. 6 characters"
                              value={resetForms[u.id]}
                              onChange={(e) =>
                                setResetForms((f) => ({ ...f, [u.id]: e.target.value }))
                              }
                            />
                            {resetErrors[u.id] && (
                              <p className="text-xs text-destructive">{resetErrors[u.id]}</p>
                            )}
                          </div>
                          <Button type="submit" size="sm" variant="destructive">
                            Set password
                          </Button>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending invites */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Invites</CardTitle>
              <CardDescription>
                Only these email addresses can register. Club role and card number are applied on sign-up.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add invite form */}
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
                      onChange={(e) =>
                        setInviteForm((f) => ({ ...f, clubRole: e.target.value as ClubRole }))
                      }
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {CLUB_ROLES.map((r) => (
                        <option key={r} value={r}>{formatClubRole(r)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="inv-card">
                      Card number{" "}
                      <span className="text-muted-foreground">(optional)</span>
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
                <Button type="submit" disabled={adding || !isEmailValid}>
                  Add invite
                </Button>
              </form>

              {/* Invite list */}
              {!loading && (
                data?.invites.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pending invites.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b">
                        <th className="pb-2 font-medium">Email</th>
                        <th className="pb-2 font-medium">Club role</th>
                        <th className="pb-2 font-medium">Card number</th>
                        <th className="pb-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {data?.invites.map((inv: Invite) => (
                        <tr key={inv.email} className="border-b last:border-0">
                          <td className="py-2">{inv.email}</td>
                          <td className="py-2">
                            <ClubRoleBadge role={inv.clubRole} />
                          </td>
                          <td className="py-2 text-muted-foreground font-mono">
                            {inv.cardNumber ?? <span className="italic">auto</span>}
                          </td>
                          <td className="py-2 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
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
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right column: Flag stuff ── */}
        <div>
          <MostWantedAdmin />
        </div>
      </div>
    </div>
  );
}
