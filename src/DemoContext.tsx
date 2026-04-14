import { createContext, useContext, useMemo, useState } from "react";

type DemoMessage = {
  id: string;
  authorName: string;
  message: string;
  createdAt: string;
};

type DemoPage = {
  slug: string;
  fullName: string;
  message: string;
  status: "open" | "closed";
  theme: "classic" | "photo" | "minimal";
  createdAt: string;
  closesAt: string;
  isSearchable: boolean;
  photoUrl: string | null;
};

type DemoContextValue = {
  demoPage: DemoPage | null;
  setDemoPage: React.Dispatch<React.SetStateAction<DemoPage | null>>;
  demoMessages: DemoMessage[];
  setDemoMessages: React.Dispatch<React.SetStateAction<DemoMessage[]>>;
  clearDemo: () => void;
};

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [demoPage, setDemoPage] = useState<DemoPage | null>(null);
  const [demoMessages, setDemoMessages] = useState<DemoMessage[]>([]);

  const value = useMemo(
    () => ({
      demoPage,
      setDemoPage,
      demoMessages,
      setDemoMessages,
      clearDemo: () => {
        setDemoPage(null);
        setDemoMessages([]);
      },
    }),
    [demoPage, demoMessages]
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);

  if (!context) {
    throw new Error("useDemo debe usarse dentro de DemoProvider");
  }

  return context;
}