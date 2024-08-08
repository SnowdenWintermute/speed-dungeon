import React, { useEffect, useRef } from "react";
import { GameWorld } from "./scene";

export default function SceneManager() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<GameWorld>();
  const resizeHandlerRef = useRef<(e: UIEvent) => void | null>();

  useEffect(() => {
    if (canvasRef.current) {
      sceneRef.current = new GameWorld(canvasRef.current);
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

  // useEffect(() => {
  //   window.addEventListener("mousemove", (e) => {
  //     if (sceneRef.current) {
  //       sceneRef.current.mouse.x = (e.x - window.innerWidth / 2) / 100;
  //       sceneRef.current.mouse.z = (e.y - window.innerHeight / 2) / 100;
  //     }
  //   });
  // }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full absolute z-[-1] pointer-events-auto"
      id="babylon-canvas"
    />
  );
}
