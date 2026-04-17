import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "@/lib/utils";

interface QueryStateRendererProps {
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  emptyMessage?: string;
  /** Optional skeleton to show while loading instead of the default spinner. */
  skeleton?: ReactNode;
  children: ReactNode;
}

/**
 * Standardized loading/error/empty state renderer for all data-fetching sections.
 * Shows loading spinner (or a custom skeleton), error message, or empty state before rendering content.
 */
export function QueryStateRenderer({
  loading,
  error,
  empty,
  emptyMessage,
  skeleton,
  children,
}: QueryStateRendererProps) {
  const { t } = useTranslation();

  if (loading) {
    if (skeleton) return <>{skeleton}</>;
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        <div className="text-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          {t("common.loading")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive text-sm">
        <div className="text-center">
          <p className="font-medium">Error</p>
          <p className="text-xs text-muted-foreground mt-1">{getErrorMessage(error)}</p>
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        {emptyMessage || t("dashboard.noData")}
      </div>
    );
  }

  return <>{children}</>;
}
