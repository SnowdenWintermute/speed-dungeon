import React, { useEffect, useRef } from "react";
import { DebugText } from "./DebugText";
import { ZIndexLayers } from "../z-index-layers";
import { ERROR_MESSAGES } from "@speed-dungeon/common";
import { GameWorldView } from "@/game-world-view";

export const gameWorldView: { current: null | GameWorldView } = { current: null };

export function getGameWorldView() {
  if (!gameWorldView.current) throw new Error(ERROR_MESSAGES.GAME_WORLD.NOT_FOUND);
  return gameWorldView.current;
}

export default function SceneManager() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debugRef = useRef<HTMLUListElement>(null);
  const resizeHandlerRef = useRef<(e: UIEvent) => void>(null);

  useEffect(() => {
    if (canvasRef.current && debugRef.current !== null) {
      gameWorldView.current = new GameWorldView(canvasRef.current, debugRef);
    }
    resizeHandlerRef.current = function () {
      gameWorldView.current?.engine?.resize();
    };

    window.addEventListener("resize", resizeHandlerRef.current);

    return () => {
      gameWorldView.current?.scene.dispose();
      gameWorldView.current?.engine.dispose();
      gameWorldView.current = null;

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
