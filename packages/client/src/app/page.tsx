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
import { useEffect, useRef } from "react";
import { ClientActionCommandReceiver } from "./client-action-command-receiver";
import { useAlertStore } from "@/stores/alert-store";
import { useNextBabylonMessagingStore } from "@/stores/next-babylon-messaging-store";
import { ActionCommand } from "@speed-dungeon/common";
import { ActionCommandManager } from "@speed-dungeon/common";
// for immer to be able to use map and set
enableMapSet();

export default function Home() {
  const game = useGameStore().game;
  const mutateGameStore = useGameStore().mutateState;
  const mutateAlertStore = useAlertStore().mutateState;
  const mutateNextBabylonMessagingStore = useNextBabylonMessagingStore().mutateState;
  const combatantModelsAwaitingSpawn = useGameStore().combatantModelsAwaitingSpawn;

  // ACTION COMMAND HANDLING - PROBABLY CAN MOVE THIS ELSEWHERE
  const actionCommandReceiverRef = useRef<null | ClientActionCommandReceiver>();
  const actionCommandManagerRef = useRef<null | ActionCommandManager>();
  const actionCommandWaitingAreaRef = useRef<ActionCommand[]>([]);

  useEffect(() => {
    actionCommandReceiverRef.current = new ClientActionCommandReceiver(
      mutateGameStore,
      mutateAlertStore,
      mutateNextBabylonMessagingStore
    );
    actionCommandManagerRef.current = new ActionCommandManager();

    return () => {
      actionCommandReceiverRef.current = null;
      actionCommandManagerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (combatantModelsAwaitingSpawn.length || !actionCommandManagerRef.current) return;
    if (actionCommandWaitingAreaRef.current.length) {
      actionCommandManagerRef.current.enqueueNewCommands(actionCommandWaitingAreaRef.current);
      actionCommandWaitingAreaRef.current = [];
    }
  }, [combatantModelsAwaitingSpawn]);

  const componentToRender = game?.timeStarted ? <Game /> : game ? <GameSetup /> : <Lobby />;

  return (
    <>
      <TailwindClassLoader />
      <SocketManager
        actionCommandReceiver={actionCommandReceiverRef}
        actionCommandManager={actionCommandManagerRef}
        actionCommandWaitingArea={actionCommandWaitingAreaRef}
      />
      <AlertManager />
      <GlobalKeyboardEventManager />
      <TooltipManager />
      <SceneManager actionCommandManager={actionCommandManagerRef} />
      {componentToRender}
    </>
  );
}
