// @refresh reset
"use client";
import SocketManager from "./WebsocketManager";
import Lobby from "./lobby";
import { enableMapSet } from "immer";
import { useGameStore } from "@/stores/game-store";
import { GameSetup } from "./lobby/game-setup";
import AlertManager from "./components/alerts/AlertManager";
import Game from "./game";
import TailwindClassLoader from "./TailwindClassLoader";
import GlobalKeyboardEventManager from "./GlobalKeyboardEventManager";
import TooltipManager from "./TooltipManager";
import SceneManager from "./3d-world/SceneManager";
// for immer to be able to use map and set
enableMapSet();

export default function Home() {
  const game = useGameStore().game;

  const componentToRender = game?.timeStarted ? <Game /> : game ? <GameSetup /> : <Lobby />;

  return (
    <>
      <TailwindClassLoader />
      <SocketManager />
      <AlertManager />
      <GlobalKeyboardEventManager />
      <TooltipManager />
      <SceneManager />
      {componentToRender}
    </>
  );
}
