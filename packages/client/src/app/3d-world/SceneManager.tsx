import React, { useEffect, useRef } from "react";
import { BasicScene } from "./scene";
import { Vector3 } from "babylonjs";

export default function SceneManager() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<BasicScene>();

  useEffect(() => {
    if (canvasRef.current) {
      sceneRef.current = new BasicScene(canvasRef.current);
    }
    window.addEventListener("resize", function () {
      sceneRef.current?.engine?.resize();
    });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", (e) => {
      if (sceneRef.current) {
        sceneRef.current.mouse.x = (e.x - window.innerWidth / 2) / 100;
        sceneRef.current.mouse.z = (e.y - window.innerHeight / 2) / 100;
      }
    });
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full absolute z-[-1] pointer-events-auto"
      id="babylon-canvas"
    />
  );
}
