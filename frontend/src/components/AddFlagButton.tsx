import { useState } from "react";
import { Plus } from "lucide-react";
import { AddFlagModal } from "./AddFlagModal";

export function AddFlagButton() {
  const [open, setOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Aggiungi bandiera"
        className="fixed bottom-6 right-6 z-40 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 h-16 overflow-hidden flex items-center"
        style={{
          width: isHovered ? "200px" : "64px",
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

      {open && <AddFlagModal onClose={() => setOpen(false)} />}
    </>
  );
}
