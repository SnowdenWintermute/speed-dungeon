"use client";
import { ClientApplication } from "@/client-application";
import { useEffect, useRef, useState } from "react";
import { createClientApplication } from "./create-client-application";
import { ClientApplicationContext } from "@/hooks/create-client-application-context";

export function ClientApplicationProvider({ children }: { children: React.ReactNode }) {
  const clientApplicationRef = useRef<ClientApplication | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const clientApplication = createClientApplication();
    clientApplicationRef.current = clientApplication;
    clientApplication.topologyManager.connectWithPrefferedMode();
    setIsReady(true);

    return () => {
      clientApplication.dispose();
    };
  }, []);

  if (!clientApplicationRef.current && typeof window !== "undefined") {
    clientApplicationRef.current = createClientApplication();
  }

  if (!isReady || !clientApplicationRef.current) {
    return null;
  }

  return (
    <ClientApplicationContext.Provider value={clientApplicationRef.current}>
      {children}
    </ClientApplicationContext.Provider>
  );
}
