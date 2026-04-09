import { useState } from "react";
import { Plus } from "lucide-react";
import { AddFlagModal } from "./AddFlagModal";

export function AddFlagButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Aggiungi bandiera"
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-300 w-14 h-14 md:hover:w-auto md:hover:px-5 md:hover:gap-2 group overflow-hidden"
      >
        <Plus size={28} className="shrink-0" />
        <span className="hidden md:block max-w-0 group-hover:max-w-[160px] overflow-hidden transition-all duration-300 whitespace-nowrap text-sm font-medium">
          Aggiungi bandiera
        </span>
      </button>

      {open && <AddFlagModal onClose={() => setOpen(false)} />}
    </>
  );
}
