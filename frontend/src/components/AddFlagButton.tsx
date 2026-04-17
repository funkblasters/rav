import { useState, lazy, Suspense, useEffect } from "react";
import { Plus } from "lucide-react";
import { useModalHistory } from "@/hooks/useModalHistory";

const AddFlagModal = lazy(() =>
  import("./AddFlagModal").then((m) => ({ default: m.AddFlagModal }))
);

export function AddFlagButton() {
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

  const handleClick = () => {
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Aggiungi bandiera"
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
          Aggiungi bandiera
        </span>
      </button>

      {open && (
        <Suspense fallback={null}>
          <AddFlagModal onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
