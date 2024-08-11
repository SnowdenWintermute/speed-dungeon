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
      sceneRef.current = new GameWorld(canvasRef.current, mutateGameState, debugRef);
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

  useEffect(() => {
    if (nextToBabylonMessages.length < 1) return;

    mutateNextBabylonMessagingStore((state) => {
      if (sceneRef.current === undefined) return;
      sceneRef.current.messages.push(...nextToBabylonMessages);
      state.nextToBabylonMessages = [];
    });
  }, [nextToBabylonMessages]);

  // useEffect(() => {
  //   window.addEventListener("mousemove", (e) => {
  //     if (sceneRef.current) {
  //       sceneRef.current.mouse.x = (e.x - window.innerWidth / 2) / 100;
  //       sceneRef.current.mouse.z = (e.y - window.innerHeight / 2) / 100;
  //     }
  //   });
  // }, []);

  return (
    <>
      <div className="absolute z-50 bottom-10 left-10" ref={debugRef}></div>
      <canvas
        ref={canvasRef}
        className="h-full w-full absolute z-[-1] pointer-events-auto"
        id="babylon-canvas"
      />
    </>
  );
}
