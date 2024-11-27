import React, { useEffect, useRef } from "react";
import { GameWorld } from "./game-world/";
import DebugText from "./DebugText";

export const gameWorld: { current: null | GameWorld } = { current: null };

export default function SceneManager() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCreatorCanvasRef = useRef<HTMLCanvasElement>(null);
  const debugRef = useRef<HTMLUListElement>(null);
  const resizeHandlerRef = useRef<(e: UIEvent) => void | null>();

  useEffect(() => {
    if (canvasRef.current && imageCreatorCanvasRef.current) {
      gameWorld.current = new GameWorld(canvasRef.current, imageCreatorCanvasRef.current, debugRef);
    }
    resizeHandlerRef.current = function () {
      gameWorld.current?.engine?.resize();
    };

    window.addEventListener("resize", resizeHandlerRef.current);

    return () => {
      gameWorld.current?.scene.dispose();
      gameWorld.current?.engine.dispose();
      gameWorld.current?.imageCreatorEngine.dispose();
      gameWorld.current = null;

      if (resizeHandlerRef.current) window.removeEventListener("resize", resizeHandlerRef.current);
    };
  }, []);

  return (
    <>
      <DebugText debugRef={debugRef} />
      <canvas
        ref={canvasRef}
        className="h-full w-full absolute z-[-1] pointer-events-auto "
        id="babylon-canvas"
      />
      <canvas
        ref={imageCreatorCanvasRef}
        className="absolute z-[-1] border bottom-0 pointer-events-auto top-0 -translate-y-full"
        style={{ height: `600px`, width: "480px" }}
        id="babylon-image-generation-canvas"
      />
    </>
  );
}
