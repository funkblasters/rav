import { useState, lazy, Suspense, useEffect } from "react";
import { Plus } from "lucide-react";
import { useModalHistory } from "@/hooks/useModalHistory";
import { useTranslation } from "react-i18next";

const AddFlagModal = lazy(() =>
  import("./AddFlagModal").then((m) => ({ default: m.AddFlagModal }))
);

export function AddFlagButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  useModalHistory(open, () => setOpen(false));
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={t("addFlagModal.title")}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 h-16 overflow-hidden flex items-center"
        style={{
          width: isMobile || !isHovered ? "64px" : "200px",
          transition: "width 700ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <div className="flex items-center justify-center flex-shrink-0 w-16 h-16">
          <Plus size={32} />
        </div>
        <span
          className="hidden md:block whitespace-nowrap text-sm font-medium pl-2 pr-6"
          style={{
            opacity: isHovered ? 1 : 0,
            transition: "opacity 700ms ease-out",
          }}
        >
          {t("addFlagModal.title")}
        </span>
      </button>

      <Suspense fallback={null}>
        <AddFlagModal open={open} onOpenChange={setOpen} />
      </Suspense>
    </>
  );
}
