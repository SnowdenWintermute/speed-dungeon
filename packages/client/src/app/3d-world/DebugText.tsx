import React, { useEffect, useRef, useState } from "react";
import { ZIndexLayers } from "../z-index-layers";
import { gameWorld } from "./SceneManager";
import { drawCompass, drawDebugGrid } from "./game-world/clear-floor-texture";
import { AppStore } from "@/mobx-stores/app-store";
import { DialogElementName } from "@/mobx-stores/dialogs";
import { observer } from "mobx-react-lite";
import { ModifierKey } from "@/mobx-stores/input";

function getGpuName() {
  if (gameWorld.current === null) return;

  const babylonGl = gameWorld.current.engine._gl;
  if (!babylonGl) return "Unknown GPU";

  // Use the standard WebGL parameter instead of the deprecated extension
  const renderer = babylonGl.getParameter(babylonGl.RENDERER);
  return renderer || "Unknown GPU";
}

export const DebugText = observer(
  ({ debugRef }: { debugRef: React.RefObject<HTMLUListElement | null> }) => {
    const { dialogStore, inputStore, imageStore } = AppStore.get();
    const itemThumbnails = imageStore.getItemThumbnails();
    const showDebug = dialogStore.isOpen(DialogElementName.Debug);
    const hotkeysDisabled = AppStore.get().inputStore.getHotkeysDisabled();
    const headerRef = useRef<HTMLDivElement>(null);
    const keydownListenerRef = useRef<(e: KeyboardEvent) => void>(null);
    const mouseDownListenerRef = useRef<(e: MouseEvent) => void>(null);
    const mouseUpListenerRef = useRef<(e: MouseEvent) => void>(null);
    const mouseMoveListenerRef = useRef<(e: MouseEvent) => void>(null);
    const mousePressedRef = useRef<null | { offsetX: number; offsetY: number }>(null);
    const [x, setX] = useState(10);
    const [y, setY] = useState(10);

    const [gpuName, setGpuName] = useState("getting GPU name...");

    useEffect(() => {
      const gpuName = getGpuName();
      // console.info(
      //   "User Agent:",
      //   navigator.userAgent,
      //   "Operating System:",
      //   navigator.platform,
      //   "Number of CPU Cores:",
      //   navigator.hardwareConcurrency,
      // );
      setGpuName(gpuName);
    }, [gameWorld.current]);

    useEffect(() => {
      keydownListenerRef.current = function (e: KeyboardEvent) {
        if (e.code !== "KeyP" || hotkeysDisabled) return;

        dialogStore.toggle(DialogElementName.Debug);
        const showDebug = dialogStore.isOpen(DialogElementName.Debug);

        if (gameWorld.current) {
          if (showDebug) {
            drawCompass(gameWorld.current);
            drawDebugGrid(gameWorld.current);
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

    const partyOption = AppStore.get().gameStore.getPartyOption();
    const inputLockStatus = partyOption
      ? JSON.stringify(partyOption.inputLock.isLocked())
      : "no party";

    const alternateClickKeyHeld = inputStore.getKeyIsHeld(ModifierKey.AlternateClick);
    const modKeyHeld = inputStore.getKeyIsHeld(ModifierKey.Mod);

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
              dialogStore.close(DialogElementName.Debug);
            }}
          >
            Hide
          </button>
        </div>
        <div className="p-2">Renderer: {gpuName}</div>

        {/* to be populated in the babylon render loop*/}
        <ul ref={debugRef} className="p-2"></ul>

        <ul className="p-2">
          <li>Alternate Click Function Key Held: {JSON.stringify(alternateClickKeyHeld)}</li>
          <li>Shift Held: {JSON.stringify(modKeyHeld)}</li>
          <li>Input Locked</li>
          <li>{inputLockStatus}</li>
        </ul>
        <ul className="flex flex-wrap bg-slate-700 w-full">
          <li key="ayy" className="border p-2 w-full mb-2">
            Num thumbnails: {itemThumbnails.size}
          </li>
          <li className="p-2 flex max-w-40 overflow-auto">
            {[...itemThumbnails.entries()].map(([id, data], i) => (
              <div className="relative w-fit" key={id}>
                <div className="absolute top-0 left-0 border bg-slate-800">{i}</div>
                <button>
                  <img alt={id} src={data} className="object-contain h-16" />
                </button>
              </div>
            ))}
          </li>
        </ul>
      </div>
    );
  }
);
