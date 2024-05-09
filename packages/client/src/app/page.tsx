// @refresh reset
"use client";
import { useEffect, useRef } from "react";
import { BasicScene } from "./babylon-examples/example";
import SocketManager from "./components/WebsocketManager";
import Lobby from "./lobby";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // const bears = useBearStore((state) => state.bears.little);

  useEffect(() => {
    if (canvasRef.current) {
      new BasicScene(canvasRef.current);
    }
  }, []);

  return (
    <>
      <SocketManager />
      <Lobby />
    </>
  );
}
// <canvas ref={canvasRef} className="h-full w-full" id="babylon-canvas" />
