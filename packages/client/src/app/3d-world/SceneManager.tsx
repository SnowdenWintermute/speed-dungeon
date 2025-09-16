import React, { useEffect, useRef } from "react";
import { GameWorld } from "./game-world";
import DebugText from "./DebugText";
import { ZIndexLayers } from "../z-index-layers";
import { ERROR_MESSAGES } from "@speed-dungeon/common";

export const gameWorld: { current: null | GameWorld } = { current: null };
export function getGameWorld() {
  if (!gameWorld.current) throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
  return gameWorld.current;
}

export default function SceneManager() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debugRef = useRef<HTMLUListElement>();
  const resizeHandlerRef = useRef<(e: UIEvent) => void | null>(null);

  useEffect(() => {}, []);

  useEffect(() => {
    if (canvasRef.current && debugRef.current !== null) {
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
      <DebugText debugRef={debugRef} />
      <canvas
        ref={canvasRef}
        className={`h-full w-full absolute pointer-events-auto `}
        style={{ zIndex: ZIndexLayers.MainCanvas }}
        id="babylon-canvas"
      />
    </>
  );
}
