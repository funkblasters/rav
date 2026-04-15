import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { slowLoadStore } from "@/lib/slowLoadStore";

const SlowLoadContext = createContext(false);

export function SlowLoadProvider({ children }: { children: ReactNode }) {
  const [isSlow, setIsSlow] = useState(slowLoadStore.isSlow());

  useEffect(() => slowLoadStore.subscribe(setIsSlow), []);

  return (
    <SlowLoadContext.Provider value={isSlow}>
      {children}
    </SlowLoadContext.Provider>
  );
}

export function useSlowLoad() {
  return useContext(SlowLoadContext);
}
