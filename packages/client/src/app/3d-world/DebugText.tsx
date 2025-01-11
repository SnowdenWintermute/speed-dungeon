import React, { useEffect, useRef, useState } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useGameStore } from "@/stores/game-store";
import { ZIndexLayers } from "../z-index-layers";
import { gameWorld } from "./SceneManager";
import { InputLock } from "@speed-dungeon/common";
import { drawCompass } from "./game-world/clear-floor-texture";

export default function DebugText({ debugRef }: { debugRef: React.RefObject<HTMLUListElement> }) {
  const thumbnails = useGameStore((state) => state.itemThumbnails);
  const showDebug = useUIStore((state) => state.showDebug);
  const hotkeysDisabled = useUIStore((state) => state.hotkeysDisabled);
  const headerRef = useRef<HTMLDivElement>(null);
  const keydownListenerRef = useRef<(e: KeyboardEvent) => void>();
  const mouseDownListenerRef = useRef<(e: MouseEvent) => void>();
  const mouseUpListenerRef = useRef<(e: MouseEvent) => void>();
  const mouseMoveListenerRef = useRef<(e: MouseEvent) => void>();
  const mousePressedRef = useRef<null | { offsetX: number; offsetY: number }>(null);
  const [x, setX] = useState(10);
  const [y, setY] = useState(10);

  useEffect(() => {
    keydownListenerRef.current = function (e: KeyboardEvent) {
      if (e.code !== "KeyP" || hotkeysDisabled) return;

      useUIStore.getState().mutateState((state) => {
        state.showDebug = !state.showDebug;
      });

      if (gameWorld.current) {
        const { showDebug } = useUIStore.getState();
        if (showDebug) {
          drawCompass(gameWorld.current);
        } else {
          gameWorld.current.clearFloorTexture();
        }

        for (const modularCharacter of Object.values(
          gameWorld.current.modelManager.combatantModels
        )) {
          if (showDebug) modularCharacter.setUpDebugMeshes();
          else modularCharacter.despawnDebugMeshes();
          modularCharacter.rootMesh.showBoundingBox = showDebug;
          if (modularCharacter.highlightManager.targetingIndicator)
            modularCharacter.highlightManager.targetingIndicator.showBoundingBox = showDebug;
        }
      }
    };

    mouseDownListenerRef.current = function (e: MouseEvent) {
      const headerBoundingRect = headerRef.current?.getBoundingClientRect();
      if (!headerBoundingRect) return;
      if (e.x > headerBoundingRect.x + headerBoundingRect.width) return;
      if (e.x < headerBoundingRect.x) return;
      if (e.y < headerBoundingRect.y) return;
      if (e.y > headerBoundingRect.y + headerBoundingRect.height) return;
      mousePressedRef.current = {
        offsetX: e.clientX - headerBoundingRect.x,
        offsetY: e.clientY - headerBoundingRect.y,
      };
    };
    mouseUpListenerRef.current = function () {
      mousePressedRef.current = null;
    };
    mouseMoveListenerRef.current = function (e: MouseEvent) {
      if (!mousePressedRef.current) return;
      const headerBoundingRect = headerRef.current?.getBoundingClientRect();
      if (!headerBoundingRect) return;

      const newX = e.clientX - mousePressedRef.current.offsetX;
      const newY = Math.max(0, e.clientY - mousePressedRef.current.offsetY);
      setX(newX);
      setY(newY);
    };

    window.addEventListener("keydown", keydownListenerRef.current);
    window.addEventListener("mousedown", mouseDownListenerRef.current);
    window.addEventListener("mouseup", mouseUpListenerRef.current);
    window.addEventListener("mousemove", mouseMoveListenerRef.current);

    return () => {
      if (keydownListenerRef.current)
        window.removeEventListener("keydown", keydownListenerRef.current);
      if (mouseDownListenerRef.current)
        window.removeEventListener("mousedown", mouseDownListenerRef.current);
      if (mouseUpListenerRef.current)
        window.removeEventListener("mouseup", mouseUpListenerRef.current);
      if (mouseMoveListenerRef.current)
        window.removeEventListener("mousemove", mouseMoveListenerRef.current);
    };
  }, [hotkeysDisabled]);

  const partyResult = useGameStore.getState().getParty();

  const alternateClickKeyHeld = useUIStore().alternateClickKeyHeld;
  const modKeyHeld = useUIStore().modKeyHeld;

  return (
    <div
      className={`absolute bottom-10 left-10 flex flex-col ${!showDebug && "hidden"} pointer-events-auto bg-black h-fit border border-white`}
      style={{ top: `${y}px`, left: `${x}px`, zIndex: ZIndexLayers.DebugText }}
    >
      <div className="cursor-grab border-b border-white flex justify-between" ref={headerRef}>
        <h5 className="p-2 ">DEBUG</h5>
        <button
          className="h-full p-2 border-l border-white"
          onClick={() => {
            useUIStore.getState().mutateState((state) => {
              state.showDebug = false;
            });
          }}
        >
          Hide
        </button>
      </div>
      <ul ref={debugRef} className="p-2"></ul>
      {/* to be populated in the babylon render loop*/}

      <div>Alternate Click Function Key Held: {JSON.stringify(alternateClickKeyHeld)}</div>
      <div>Shift Held: {JSON.stringify(modKeyHeld)}</div>
      <div>Input Locked</div>
      <div>
        {!(partyResult instanceof Error)
          ? JSON.stringify(InputLock.isLocked(partyResult.inputLock))
          : "error"}
      </div>
      <ul className="flex max-w-96 flex-wrap">
        <li key="ayy" className="border p-5 bg-slate-700">
          Num thumbnails: {Object.keys(thumbnails).length}
        </li>
        {Object.entries(thumbnails).map(([id, data], i) => (
          <div className="relative" key={id}>
            <div className="absolute top-0 left-0 border bg-slate-800">{i}</div>
            <button
              onClick={() => {
                useGameStore.getState().mutateState((state) => {
                  state.itemThumbnails[id];
                });
              }}
            >
              <img alt={id} src={data} className="object-contain h-16" />
            </button>
          </div>
        ))}
      </ul>
    </div>
  );
}
