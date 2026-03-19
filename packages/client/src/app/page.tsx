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
import { useEffect } from "react";
import { AssetManager } from "./asset-manager";
import { getApplicationRuntimeManager } from "@/singletons";
import { ClientApplication } from "@/client-application";
import { ReplayTreeScheduler } from "@/client-application/replay-execution/replay-tree-scheduler";

// for immer to be able to use map and set
enableMapSet();
// const replayProcessorManager = new ReplayTreeScheduler();
// const clientApplication = new ClientApplication(null);

export default observer(() => {
  const game = AppStore.get().gameStore.getGameOption();
  const focusedCharacterOption = AppStore.get().gameStore.getFocusedCharacterOption();

  const shouldShowGame = focusedCharacterOption !== undefined && game?.getTimeStarted();

  useEffect(() => {
    getApplicationRuntimeManager().enterOnline();
  }, []);

  const componentToRender = shouldShowGame ? (
    <Game />
  ) : game ? (
    <GameSetup gameMode={game.mode} />
  ) : (
    <Lobby />
  );

  return (
    <>
      <AssetManager />
      <TailwindClassLoader />
      <AlertManager />
      <GlobalKeyboardEventManager />
      <TooltipManager />
      <SceneManager />
      <SkyColorProvider>{componentToRender}</SkyColorProvider>
    </>
  );
});
