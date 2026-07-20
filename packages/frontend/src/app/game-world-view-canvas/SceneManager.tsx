"use client";
import React, { useEffect, useRef } from "react";
import { ZIndexLayers } from "../z-index-layers";
import { GameWorldView } from "@/game-world-view";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { createBabylonScheduler } from "@/client-application/replay-execution/replay-tree-tick-schedulers";
import { synchronizeActionEntityModels } from "@/client-application/replay-execution/update-handlers/spawn-entities-update-handler";
import { DebugPanel } from "../debug/debug-panel";

export const SceneManager = observer(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debugRef = useRef<HTMLUListElement>(null);
  const resizeHandlerRef = useRef<(e: UIEvent) => void>(null);
  const clientApplication = useClientApplication();

  useEffect(() => {
    let gameWorldView: undefined | GameWorldView;
    if (canvasRef.current && debugRef.current !== null) {
      gameWorldView = new GameWorldView(canvasRef.current);
      clientApplication.setGameWorldView(gameWorldView);
      gameWorldView.initialize(clientApplication, debugRef);
      clientApplication.setReplayManagerTickScheduler(
        createBabylonScheduler(gameWorldView.engine, gameWorldView.scene)
      );

      gameWorldView.sceneEntityService.combatantSceneEntityManager.synchronizeCombatantModels({});
      // on reconnection/refresh the GameFullUpdate arrives before this scene exists, so respawn
      // persistent action entities (e.g. a firewall) and their cosmetic effects now that it does
      void synchronizeActionEntityModels(clientApplication);

      canvasRef.current.addEventListener("webglcontextlost", (e) => {
        console.error("context lost!", e);
      });
    }
    resizeHandlerRef.current = function () {
      clientApplication.gameWorldView?.engine.resize();
    };

    window.addEventListener("resize", resizeHandlerRef.current);

    return () => {
      if (resizeHandlerRef.current) {
        window.removeEventListener("resize", resizeHandlerRef.current);
      }
      if (gameWorldView) {
        gameWorldView.dispose();
      }
    };
  }, [clientApplication]);

  return (
    <>
      <DebugPanel debugRef={debugRef} />
      <canvas
        ref={canvasRef}
        className={`h-full w-full absolute pointer-events-auto `}
        style={{ zIndex: ZIndexLayers.MainCanvas }}
        id="babylon-canvas"
      />
    </>
  );
});
