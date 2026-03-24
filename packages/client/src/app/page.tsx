// @refresh reset
"use client";
import { AlertManager } from "./components/alerts/AlertManager";
import TailwindClassLoader from "./TailwindClassLoader";
import GlobalKeyboardEventManager from "./GlobalKeyboardEventManager";
import { TooltipManager } from "./TooltipManager";
import { SkyColorProvider } from "./SkyColorProvider";
import { observer } from "mobx-react-lite";
import { SceneManager } from "./game-world-view-canvas/SceneManager";
import { useEffect, useRef, useState } from "react";
import { AssetManager } from "./asset-manager";
import { ClientApplication } from "@/client-application";
import { ClientApplicationContext } from "@/hooks/create-client-application-context";
import { MainAppWindow } from "./MainAppWindow";
import { createClientApplication } from "./create-client-application";

export default observer(() => {
  const clientApplicationRef = useRef<ClientApplication | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const clientApplication = createClientApplication();
    clientApplicationRef.current = clientApplication;
    clientApplication.topologyManager.enterOnline();
    setIsReady(true);
    return () => {
      clientApplication.dispose();
    };
  }, []);

  if (!clientApplicationRef.current && typeof window !== "undefined") {
    clientApplicationRef.current = createClientApplication();
    console.log("createClientApplication");
  }

  if (!isReady || !clientApplicationRef.current) {
    return null;
  }

  return (
    <ClientApplicationContext.Provider value={clientApplicationRef.current}>
      <AssetManager />
      <TailwindClassLoader />
      <AlertManager />
      <GlobalKeyboardEventManager />
      <TooltipManager />
      <SceneManager />
      <SkyColorProvider>
        <MainAppWindow />
      </SkyColorProvider>
    </ClientApplicationContext.Provider>
  );
});
