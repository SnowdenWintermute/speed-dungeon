// @refresh reset
"use client";
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
import { useEffect } from "react";
import {
  actionCommandManager,
  actionCommandReceiver,
  actionCommandWaitingArea,
} from "@/singletons/action-command-manager";
import { ClientActionCommandReceiver } from "./client-action-command-receiver";
import WebsocketManager from "./WebsocketManager";
// for immer to be able to use map and set
enableMapSet();

export default function Home() {
  const game = useGameStore().game;
  const combatantModelsAwaitingSpawn = useGameStore().combatantModelsAwaitingSpawn;

  useEffect(() => {
    actionCommandReceiver.current = new ClientActionCommandReceiver();

    return () => {
      actionCommandReceiver.current = null;
    };
  }, []);

  useEffect(() => {
    if (combatantModelsAwaitingSpawn.length || !actionCommandManager) return;
    if (actionCommandWaitingArea.length) {
      actionCommandManager.enqueueNewCommands(
        actionCommandWaitingArea.splice(0, actionCommandWaitingArea.length)
      );
    }
  }, [combatantModelsAwaitingSpawn]);

  const componentToRender = game?.timeStarted ? (
    <Game />
  ) : game ? (
    <GameSetup game={game} />
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
      {componentToRender}
    </>
  );
}
