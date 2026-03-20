// @refresh reset
"use client";
import { Lobby } from "./lobby";
import { enableMapSet } from "immer";
import { GameSetup } from "./lobby/game-setup";
import AlertManager from "./components/alerts/AlertManager";
import { Game } from "./game";
import TailwindClassLoader from "./TailwindClassLoader";
import GlobalKeyboardEventManager from "./GlobalKeyboardEventManager";
import { TooltipManager } from "./TooltipManager";
import { SkyColorProvider } from "./SkyColorProvider";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";
import SceneManager from "./game-world-view-canvas/SceneManager";
import { useEffect, useRef, useState } from "react";
import { AssetManager } from "./asset-manager";
import { getApplicationRuntimeManager } from "@/singletons";
import { ClientApplication } from "@/client-application";
import { IndexedDbAssetStore } from "@speed-dungeon/common";
import { ManualTickScheduler } from "@/client-application/replay-execution/replay-tree-tick-schedulers";
import { ClientApplicationContext } from "@/hooks/create-client-application-context";

// for immer to be able to use map and set
enableMapSet();

function createClientApplication() {
  const assetCache = new IndexedDbAssetStore(indexedDB);
  const tickScheduler = new ManualTickScheduler();
  return new ClientApplication(null, assetCache, "", tickScheduler.scheduler);
}

export default observer(() => {
  const game = AppStore.get().gameStore.getGameOption();
  const focusedCharacterOption = AppStore.get().gameStore.getFocusedCharacterOption();

  const shouldShowGame = focusedCharacterOption !== undefined && game?.getTimeStarted();

  useEffect(() => {
    getApplicationRuntimeManager().enterOnline();
  }, []);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    clientApplicationRef.current = createClientApplication();
    setIsReady(true);
  }, []);

  const clientApplicationRef = useRef<ClientApplication | null>(null);

  if (!clientApplicationRef.current && typeof window !== "undefined") {
    clientApplicationRef.current = createClientApplication();
  }

  if (!isReady || !clientApplicationRef.current) {
    return null;
  }

  console.log("client application:", clientApplicationRef.current);

  const componentToRender = shouldShowGame ? (
    <Game />
  ) : game ? (
    <GameSetup gameMode={game.mode} />
  ) : (
    <Lobby />
  );

  return (
    <ClientApplicationContext.Provider value={clientApplicationRef.current}>
      <AssetManager />
      <TailwindClassLoader />
      <AlertManager />
      <GlobalKeyboardEventManager />
      <TooltipManager />
      <SceneManager />
      <SkyColorProvider>{componentToRender}</SkyColorProvider>
    </ClientApplicationContext.Provider>
  );
});
