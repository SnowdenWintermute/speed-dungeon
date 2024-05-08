// @refresh reset
"use client";
import { useEffect, useRef } from "react";
import { BasicScene } from "./babylon-examples/example";
import SocketManager from "./components/WebsocketManager";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // const bears = useBearStore((state) => state.bears.little);

  useEffect(() => {
    if (canvasRef.current) {
      new BasicScene(canvasRef.current);
    }
  }, []);

  return (
    <main className="box-border h-screen w-screen bg-slate-800 text-zinc-300 relative">
      <SocketManager />
    </main>
  );
}
// <canvas ref={canvasRef} className="h-full w-full" id="babylon-canvas" />
