import { useState, lazy, Suspense, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";

const AddFlagModal = lazy(() =>
  import("./AddFlagModal").then((m) => ({ default: m.AddFlagModal }))
);

export function AddFlagButton() {
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      setOpen(true);
    });
  };

  return (
    <>
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Aggiungi bandiera"
        disabled={isPending}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 h-16 overflow-hidden flex items-center"
        style={{
          width: isHovered ? "200px" : "64px",
          transition: "width 700ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <div className="flex items-center justify-center flex-shrink-0 w-16 h-16">
          {isPending
            ? <Loader2 size={32} className="animate-spin" />
            : <Plus size={32} />
          }
        </div>
        <span
          className="hidden md:block whitespace-nowrap text-sm font-medium pl-2 pr-6"
          style={{
            opacity: isHovered ? 1 : 0,
            transition: "opacity 700ms ease-out",
          }}
        >
          {isPending ? "Caricamento..." : "Aggiungi bandiera"}
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
