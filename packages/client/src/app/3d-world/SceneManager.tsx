import React, { MutableRefObject, useEffect, useRef } from "react";
import { GameWorld } from "./game-world/";
import { useNextBabylonMessagingStore } from "@/stores/next-babylon-messaging-store";
import { useGameStore } from "@/stores/game-store";
import { ActionCommandManager } from "@speed-dungeon/common";

export default function SceneManager({
  actionCommandManager,
}: {
  actionCommandManager: MutableRefObject<ActionCommandManager | null | undefined>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<GameWorld | null>(null);
  const debugRef = useRef<HTMLDivElement>(null);
  const resizeHandlerRef = useRef<(e: UIEvent) => void | null>();
  const mutateNextBabylonMessagingStore = useNextBabylonMessagingStore().mutateState;
  const nextToBabylonMessages = useNextBabylonMessagingStore().nextToBabylonMessages;
  const mutateGameState = useGameStore().mutateState;

  useEffect(() => {
    if (canvasRef.current) {
      sceneRef.current = new GameWorld(
        canvasRef.current,
        mutateGameState,
        mutateNextBabylonMessagingStore,
        actionCommandManager,
        debugRef
      );
    }
    resizeHandlerRef.current = function () {
      sceneRef.current?.engine?.resize();
    };
    window.addEventListener("resize", resizeHandlerRef.current);

    return () => {
      sceneRef.current?.scene.dispose();
      sceneRef.current?.engine.dispose();
      sceneRef.current = null;

      if (resizeHandlerRef.current) window.removeEventListener("resize", resizeHandlerRef.current);
    };
  }, []);

  // SEND MESSAGES TO BABYLON
  useEffect(() => {
    if (nextToBabylonMessages.length < 1) return;

    mutateNextBabylonMessagingStore((state) => {
      if (sceneRef.current === null) return;
      sceneRef.current.messages.push(...nextToBabylonMessages);
      state.nextToBabylonMessages = [];
    });
  }, [nextToBabylonMessages]);

  return (
    <>
      <div ref={debugRef} className="absolute z-50 bottom-10 left-10"></div>
      <canvas
        ref={canvasRef}
        className="h-full w-full absolute z-[-1] pointer-events-auto"
        id="babylon-canvas"
      />
    </>
  );
}
