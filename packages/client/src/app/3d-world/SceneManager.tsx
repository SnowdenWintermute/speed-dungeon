import React, { useEffect, useRef } from "react";
import { GameWorld } from "./game-world/";
import { useNextBabylonMessagingStore } from "@/stores/next-babylon-messaging-store";
import { useGameStore } from "@/stores/game-store";

export const gameWorld: { current: null | GameWorld } = { current: null };

export default function SceneManager() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debugRef = useRef<HTMLDivElement>(null);
  const resizeHandlerRef = useRef<(e: UIEvent) => void | null>();
  const mutateNextBabylonMessagingStore = useNextBabylonMessagingStore().mutateState;
  const mutateGameState = useGameStore().mutateState;

  useEffect(() => {
    if (canvasRef.current) {
      gameWorld.current = new GameWorld(canvasRef.current, debugRef);
    }
    resizeHandlerRef.current = function () {
      gameWorld.current?.engine?.resize();
    };
    window.addEventListener("resize", resizeHandlerRef.current);

    return () => {
      gameWorld.current?.scene.dispose();
      gameWorld.current?.engine.dispose();
      gameWorld.current = null;

      if (resizeHandlerRef.current) window.removeEventListener("resize", resizeHandlerRef.current);
    };
  }, []);

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
