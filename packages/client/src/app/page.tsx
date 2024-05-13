// @refresh reset
"use client";
import { useEffect, useRef } from "react";
import { BasicScene } from "./babylon-examples/example";
import SocketManager from "./components/WebsocketManager";
import Lobby from "./lobby";
import { enableMapSet } from "immer";
import { useGameStore } from "@/stores/game-store";
// for immer to be able to use map and set
enableMapSet();

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const game = useGameStore().game;
  // const bears = useBearStore((state) => state.bears.little);

  useEffect(() => {
    if (canvasRef.current) {
      new BasicScene(canvasRef.current);
    }
  }, []);

  const componentToRender = game?.timeStarted ? <div /> : game ? <span /> : <Lobby />;

  return (
    <>
      <SocketManager />
      {componentToRender}
    </>
  );
}
// <canvas ref={canvasRef} className="h-full w-full" id="babylon-canvas" />
