"use client";
import { ClientApplication } from "@/client-application";
import { useEffect, useRef, useState } from "react";
import { createClientApplication } from "./create-client-application";
import { ClientApplicationContext } from "@/hooks/create-client-application-context";
import { SHOULD_CLEAR_ASSET_CACHE_IN_DEV } from "@/client-consts";

export function ClientApplicationProvider({ children }: { children: React.ReactNode }) {
  const clientApplicationRef = useRef<ClientApplication | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const clientApplication = createClientApplication();
    clientApplicationRef.current = clientApplication;
    clientApplication.makeObservable();

    clientApplication.assetService.initialize({
      clearCache:
        process.env.NODE_ENV === "production"
          ? process.env.NEXT_PUBLIC_SHOULD_CLEAR_CACHE_IN_PRODUCTION === "true"
          : SHOULD_CLEAR_ASSET_CACHE_IN_DEV,
    });

    clientApplication.topologyManager.connectWithPrefferedMode();

    clientApplication.topologyManager.transitionToLobbyServer
      .waitFor()
      .then()
      .catch((error) => {
        if (error instanceof Error) {
          console.info("error connecting with preferred mode");
        }
        clientApplication.alertsService.setAlert(new Error("Unable to make a connection"), false);
      });

    setIsReady(true);

    return () => {
      clientApplication.dispose();
    };
  }, []);

  if (!isReady || !clientApplicationRef.current) {
    return null;
  }

  return (
    <ClientApplicationContext.Provider value={clientApplicationRef.current}>
      {children}
    </ClientApplicationContext.Provider>
  );
}
