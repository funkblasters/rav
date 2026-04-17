import { useQuery, useMutation, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon, LogOut, User, Pencil, ArrowLeft, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ClubRoleBadge } from "@/components/ClubRoleBadge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { MaritimeFlags } from "@/components/MaritimeFlags";
import { useModalHistory } from "@/hooks/useModalHistory";
import { useTheme } from "@/context/ThemeContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MY_PROFILE = gql`
  query MyProfile {
    myProfile {
      id
      displayName
      email
      role
      clubRole
      cardNumber
      avatarUrl
      createdAt
      flagsCount
      lastContribution
      contributionsByContinent {
        continent
        count
      }
    }
  }
`;

const UPDATE_MY_AVATAR = gql`
  mutation UpdateMyAvatar($avatarUrl: String) {
    updateMyAvatar(avatarUrl: $avatarUrl) {
      id
      avatarUrl
    }
  }
`;

// Avatar colors using shadcn neutral palette
const AVATAR_COLORS = [
  "bg-slate-400",
  "bg-slate-500",
  "bg-zinc-400",
  "bg-zinc-500",
  "bg-stone-400",
  "bg-stone-500",
  "bg-neutral-400",
  "bg-neutral-500",
];

const AVATAR_OPTIONS = [
  "https://upload.wikimedia.org/wikipedia/commons/c/c6/Roundel_of_Laos_%28old%29.svg",
  "https://upload.wikimedia.org/wikipedia/commons/c/c6/Roundel_of_Ethiopia.svg",
  "https://upload.wikimedia.org/wikipedia/commons/3/33/Roundel_of_Moldova.svg",
  "https://upload.wikimedia.org/wikipedia/commons/6/6e/Roundel_of_Venezuela_%E2%80%93_National_Guard.svg",
  "https://upload.wikimedia.org/wikipedia/commons/6/67/Roundel_of_Australia.svg",
  "https://upload.wikimedia.org/wikipedia/commons/e/e2/Roundel_of_Ukraine_%281992%29.svg",
  "https://upload.wikimedia.org/wikipedia/commons/0/06/Roundel_of_Djibouti.svg",
  "https://upload.wikimedia.org/wikipedia/commons/5/58/Roundel_of_Sudan_%28blue%29.svg",
  "https://upload.wikimedia.org/wikipedia/commons/d/dd/Roundel_of_India_1947-1948_%28variant%29.svg",
  "https://upload.wikimedia.org/wikipedia/commons/9/9c/Roundel_of_Canada_%281967%29_%E2%80%93_Centennial.svg",
  "https://upload.wikimedia.org/wikipedia/commons/4/4a/Roundel_of_Uganda_-_Type_2.svg",
  "https://upload.wikimedia.org/wikipedia/commons/a/ad/Roundel_of_Brazil_%E2%80%93_Naval_Aviation.svg",
  "https://upload.wikimedia.org/wikipedia/commons/e/e4/Roundel_of_Ghana.svg",
  "https://upload.wikimedia.org/wikipedia/commons/c/cb/TAF_roundel_%28variant%29.svg",
  "https://upload.wikimedia.org/wikipedia/commons/4/4c/Roundel_of_Georgia_%282004%E2%80%932021%29.svg",
  "https://upload.wikimedia.org/wikipedia/commons/3/36/Roundel_of_the_Soviet_Union_%281945%E2%80%931991%29.svg",
  "https://upload.wikimedia.org/wikipedia/commons/8/8a/Roundel_of_Switzerland.svg",
  "https://upload.wikimedia.org/wikipedia/commons/0/0f/Roundel_of_Zaire_%281971%E2%80%931997%29.svg",
  "https://upload.wikimedia.org/wikipedia/commons/1/1d/Roundel_of_Malaysia.svg",
  "https://upload.wikimedia.org/wikipedia/commons/f/f1/Roundel_of_Ecuador.svg",
  "https://upload.wikimedia.org/wikipedia/commons/7/7e/Roundel_of_the_Republic_of_China.svg",
  "https://upload.wikimedia.org/wikipedia/commons/8/8d/Roundel_of_Saudi_Arabia.svg",
  "https://upload.wikimedia.org/wikipedia/commons/0/01/Roundel_of_South_Sudan_V2.svg",
  "https://upload.wikimedia.org/wikipedia/commons/c/c0/Roundel_of_Mozambique_%281975%E2%80%932011%29.svg",
];

function getAvatarColor(name: string): string {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface AvatarDisplayProps {
  displayName: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "lg";
}

export function AvatarDisplay({ displayName, avatarUrl, size = "lg" }: AvatarDisplayProps) {
  const sizeClasses =
    size === "lg" ? "w-24 h-24 text-5xl" :
    size === "sm" ? "w-14 h-14 text-2xl" :
    "w-7 h-7 text-xs";
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className={`${sizeClasses} rounded-full object-contain shadow-sm`}
      />
    );
  }
  return (
    <div
      className={`${sizeClasses} rounded-full ${getAvatarColor(displayName)} flex items-center justify-center font-bold text-white shadow-sm`}
    >
      {displayName.charAt(0).toUpperCase()}
    </div>
  );
}

export function UserPanel() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  useModalHistory(open, () => { setOpen(false); setShowAvatarPicker(false); });
  const { data, loading } = useQuery(MY_PROFILE, { skip: !open });
  const [updateMyAvatar] = useMutation(UPDATE_MY_AVATAR, {
    refetchQueries: [{ query: MY_PROFILE }, "TopMembers"],
  });

  const profile = data?.myProfile;

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/login");
  };

  const LANGUAGES = ["en", "it", "es", "tr"] as const;
  const LANGUAGE_LABELS: Record<string, string> = { en: "EN", it: "IT", es: "ES", tr: "TR" };
  const currentLang = LANGUAGES.find((l) => i18n.language.startsWith(l)) ?? "en";

  const handleAvatarSelect = async (avatarUrl: string | null) => {
    await updateMyAvatar({ variables: { avatarUrl } });
    setShowAvatarPicker(false);
  };

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="max-w-[120px] truncate gap-2"
      >
        <User size={16} />
        {user?.displayName}
      </Button>

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setShowAvatarPicker(false); }}>
        <SheetContent side="right" className="w-full sm:max-w-sm flex flex-col p-0 [&_[data-slot=scroll-area-viewport]]:!static">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>{t("profile.title")}</SheetTitle>
          </SheetHeader>

          {loading ? (
            <ScrollArea className="flex-1 h-0 relative">
              <div className="space-y-6 px-6 py-0 w-full pt-12">
                {/* Settings Button Group - Positioned Absolute Top Right */}
                <div className="absolute top-0 right-0 flex items-center gap-1 p-2 shrink-0 z-10">
                  <Button variant="ghost" size="icon" disabled>
                    <Moon size={16} />
                  </Button>
                  <select
                    value={currentLang}
                    disabled
                    className="text-xs font-semibold bg-transparent border-none outline-none text-foreground opacity-50"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>{LANGUAGE_LABELS[l]}</option>
                    ))}
                  </select>
                  <Button variant="ghost" size="icon" disabled>
                    <LogOut size={16} />
                  </Button>
                </div>

                {/* Card Face Skeleton */}
                <div className="w-full flex flex-col items-center justify-center space-y-4 text-center">
                  <Skeleton className="w-24 h-24 rounded-full" />
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-24" />
                </div>

                <Separator />

                {/* Quick Stats Skeleton */}
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="flex flex-col items-center space-y-2">
                      <Skeleton className="h-10 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex flex-col items-center space-y-1 w-full border-t pt-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center space-y-3">
                    <div className="flex flex-col items-center space-y-2">
                      <Skeleton className="h-10 w-12" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex flex-col items-center space-y-1 w-full border-t pt-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Achievements Skeleton */}
                <div className="w-full flex flex-col items-center">
                  <Skeleton className="h-5 w-32 mb-4" />
                  <Skeleton className="w-full h-48 rounded-lg" />
                </div>
              </div>
            </ScrollArea>
          ) : profile ? (
            showAvatarPicker ? (
              /* ── Avatar Picker ── */
              <ScrollArea className="flex-1 h-0">
                <div className="px-6 py-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setShowAvatarPicker(false)}>
                      <ArrowLeft size={16} />
                    </Button>
                    <span className="text-sm font-semibold">{t("profile.chooseAvatar")}</span>
                  </div>

                  {/* Reset to letter avatar */}
                  <button
                    onClick={() => handleAvatarSelect(null)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-secondary ${!profile.avatarUrl ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${getAvatarColor(profile.displayName)} flex items-center justify-center text-lg font-bold text-white shrink-0`}
                    >
                      {profile.displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm">{t("profile.defaultAvatar")}</span>
                    {!profile.avatarUrl && <Check size={16} className="ml-auto text-primary" />}
                  </button>

                  {/* Roundel grid */}
                  <div className="grid grid-cols-4 gap-3">
                    {AVATAR_OPTIONS.map((url) => (
                      <button
                        key={url}
                        onClick={() => handleAvatarSelect(url)}
                        className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary ${profile.avatarUrl === url ? "border-primary shadow-md" : "border-transparent"}`}
                      >
                        <img src={url} alt="" className="w-full h-full object-contain" />
                        {profile.avatarUrl === url && (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/20 rounded-full">
                            <Check size={16} className="text-primary" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            ) : (
              /* ── Normal Profile View ── */
              <ScrollArea className="flex-1 h-0 relative">
                {/* Settings Button Group - Positioned Absolute Top Right */}
                <div className="absolute top-0 right-0 flex items-center gap-1 p-2 shrink-0 z-10">
                  {/* Theme Toggle */}
                  <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
                    {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                  </Button>
                  {/* Language Select */}
                  <select
                    value={currentLang}
                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                    className="text-xs font-semibold bg-transparent border-none outline-none cursor-pointer text-foreground"
                    aria-label="Select language"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>{LANGUAGE_LABELS[l]}</option>
                    ))}
                  </select>
                  {/* Logout Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowLogoutDialog(true)}
                    aria-label="Logout"
                  >
                    <LogOut size={16} />
                  </Button>
                </div>
                <div className="space-y-6 px-6 py-0 w-full pt-12">
                  {/* Card Face */}
                  <div className="w-full flex flex-col items-center justify-center space-y-4 text-center">
                    {/* Avatar with edit button */}
                    <div className="relative inline-block">
                      <AvatarDisplay displayName={profile.displayName} avatarUrl={profile.avatarUrl} size="lg" />
                      <button
                        onClick={() => setShowAvatarPicker(true)}
                        className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center shadow-sm hover:bg-secondary transition-colors"
                        aria-label={t("profile.editAvatar")}
                      >
                        <Pencil size={12} />
                      </button>
                    </div>

                    {/* Name */}
                    <h2 className="text-3xl font-bold leading-tight">
                      {profile.displayName}
                    </h2>

                    {/* Card Number */}
                    <div className="font-mono text-xs text-muted-foreground bg-secondary px-3 py-2 rounded">
                      {t("profile.cardNumber")} {profile.cardNumber}
                    </div>

                    {/* Club Role Badge */}
                    <ClubRoleBadge role={profile.clubRole} />
                  </div>

                  <Separator />

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 w-full">
                    {/* Total Flags & Last Contribution (stacked) */}
                    <div className="flex flex-col items-center space-y-3">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-4xl font-bold">
                          {profile.flagsCount}
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          {t("profile.totalFlags")}
                        </p>
                      </div>
                      <div className="flex flex-col items-center space-y-1 border-t pt-2">
                        <div className="text-xs text-muted-foreground">
                          {formatDate(profile.lastContribution)}
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          {t("profile.lastContribution")}
                        </p>
                      </div>
                    </div>

                    {/* Continents Touched & Member Since (stacked) */}
                    <div className="flex flex-col items-center space-y-3">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-4xl font-bold">
                          {profile.contributionsByContinent?.length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          {t("profile.continentsTouched")}
                        </p>
                      </div>
                      <div className="flex flex-col items-center space-y-1 border-t pt-2">
                        <div className="text-xs text-muted-foreground">
                          {formatDate(profile.createdAt)}
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          {t("profile.memberSince")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Stats Button */}
                  <button
                    onClick={() => { setOpen(false); navigate("/stats"); }}
                    className="w-full py-3 rounded-lg font-semibold text-sm bg-foreground text-background hover:opacity-90 transition-opacity"
                  >
                    {t("nav.myStats")}
                  </button>

                  <Separator />

                  {/* Achievements */}
                  <div className="w-full flex flex-col items-center">
                    <h3 className="text-sm font-semibold mb-4 w-full">
                      {t("profile.achievements")}
                    </h3>
                    <Carousel className="w-full">
                      <CarouselContent>
                        <CarouselItem className="flex items-center justify-center">
                          <div className="w-full flex flex-col items-center justify-center h-48 border rounded-lg bg-secondary/10">
                            <p className="text-sm text-muted-foreground text-center px-4">
                              {t("profile.noAchievements")}
                            </p>
                          </div>
                        </CarouselItem>
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                  </div>
                </div>
              </ScrollArea>
            )
          ) : null}
          <div className="shrink-0 flex justify-center pb-6 pt-4 border-t">
            <MaritimeFlags text="GRAZIEAAL" size="sm" />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("nav.logout")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("auth.logoutConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              {t("nav.logout")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
