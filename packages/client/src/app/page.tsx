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
import SceneManager from "./3d-world/SceneManager";
import WebsocketManager from "./websocket-manager";
import { SkyColorProvider } from "./SkyColorProvider";
import { observer } from "mobx-react-lite";
import { AppStore } from "@/mobx-stores/app-store";
// for immer to be able to use map and set
enableMapSet();

export default observer(() => {
  const game = AppStore.get().gameStore.getGameOption();
  const focusedCharacterOption = AppStore.get().gameStore.getFocusedCharacterOption();

  const shouldShowGame = focusedCharacterOption !== undefined && game?.timeStarted !== undefined;

  const componentToRender = shouldShowGame ? (
    <Game />
  ) : game ? (
    <GameSetup gameMode={game.mode} />
  ) : (
    <Lobby />
  );

  return (
    <>
      <TailwindClassLoader />
      <WebsocketManager />
      <AlertManager />
      <GlobalKeyboardEventManager />
      <TooltipManager />
      <SceneManager />
      <SkyColorProvider>{componentToRender}</SkyColorProvider>
    </>
  );
});
