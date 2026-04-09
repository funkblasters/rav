import { useQuery, gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon, LogOut } from "lucide-react";
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
import { useTheme } from "@/context/ThemeContext";

const MY_PROFILE = gql`
  query MyProfile {
    myProfile {
      id
      displayName
      email
      role
      clubRole
      cardNumber
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

export function UserPanel() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data, loading } = useQuery(MY_PROFILE, { skip: !open });

  const profile = data?.myProfile;

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/login");
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "it" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="max-w-[120px] truncate"
      >
        {user?.displayName}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
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
                  <Button variant="ghost" size="icon" disabled>
                    <span className="text-xs">EN</span>
                  </Button>
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
            <ScrollArea className="flex-1 h-0 relative">
              {/* Settings Button Group - Positioned Absolute Top Right */}
              <div className="absolute top-0 right-0 flex items-center gap-1 p-2 shrink-0 z-10">
                {/* Theme Toggle */}
                <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
                  {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                </Button>
                {/* Language Toggle */}
                <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label="Toggle language">
                  {i18n.language === "en" ? "IT" : "EN"}
                </Button>
                {/* Logout Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="md:hidden"
                  aria-label="Logout"
                >
                  <LogOut size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="hidden md:flex"
                  aria-label="Logout"
                >
                  <LogOut size={16} />
                </Button>
              </div>
              <div className="space-y-6 px-6 py-0 w-full pt-12">
                {/* Card Face */}
                <div className="w-full flex flex-col items-center justify-center space-y-4 text-center">
                  {/* Avatar */}
                  <div
                    className={`w-24 h-24 rounded-full ${getAvatarColor(
                      profile.displayName
                    )} flex items-center justify-center text-5xl font-bold text-white shadow-sm`}
                  >
                    {profile.displayName.charAt(0).toUpperCase()}
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
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
