import React, { useEffect, useRef } from "react";
import { GameWorld } from "./game-world/";
import { useNextBabylonMessagingStore } from "@/stores/next-babylon-messaging-store";
import { useGameStore } from "@/stores/game-store";

export default function SceneManager() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<GameWorld>();
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
        debugRef
      );
    }
    resizeHandlerRef.current = function () {
      sceneRef.current?.engine?.resize();
    };
    window.addEventListener("resize", resizeHandlerRef.current);

    return () => {
      sceneRef.current?.scene.dispose();

      if (resizeHandlerRef.current) window.removeEventListener("resize", resizeHandlerRef.current);
    };
  }, []);

  // SEND MESSAGES TO BABYLON
  useEffect(() => {
    if (nextToBabylonMessages.length < 1) return;

    mutateNextBabylonMessagingStore((state) => {
      if (sceneRef.current === undefined) return;
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
