import React, { useEffect, useRef, useState } from "react";

import { ZIndexLayers } from "../z-index-layers";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import { DialogElementName } from "@/client-application/ui/dialogs";
import { ModifierKey } from "@/client-application/ui/inputs";

export const DebugText = observer(
  ({ debugRef }: { debugRef: React.RefObject<HTMLUListElement | null> }) => {
    const clientApplication = useClientApplication();
    const { uiStore, gameWorldView, imageStore } = clientApplication;
    const { dialogs, inputs } = uiStore;
    const itemThumbnails = imageStore.getItemThumbnails();
    const showDebug = dialogs.isOpen(DialogElementName.Debug);
    const hotkeysDisabled = inputs.getHotkeysDisabled();
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
      if (!gameWorldView?.initialized) return;
      const gpuName = gameWorldView?.debug.getGpuName();
      // console.info(
      //   "User Agent:",
      //   navigator.userAgent,
      //   "Operating System:",
      //   navigator.platform,
      //   "Number of CPU Cores:",
      //   navigator.hardwareConcurrency,
      // );
      setGpuName(gpuName);
    }, [gameWorldView, gameWorldView?.initialized]);

    useEffect(() => {
      keydownListenerRef.current = function (e: KeyboardEvent) {
        if (e.code !== "KeyP" || hotkeysDisabled) return;

        dialogs.toggle(DialogElementName.Debug);
        const showDebug = dialogs.isOpen(DialogElementName.Debug);

        if (gameWorldView?.initialized) {
          if (showDebug) {
            gameWorldView.debug.show();
          } else {
            gameWorldView.debug.hide();
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
    }, [hotkeysDisabled, gameWorldView?.initialized]);

    const { gameContext } = clientApplication;
    const { partyOption } = gameContext;
    const inputLockStatus = partyOption
      ? JSON.stringify(partyOption.inputLock.isLocked())
      : "no party";

    const alternateClickKeyHeld = inputs.getKeyIsHeld(ModifierKey.AlternateClick);
    const modKeyHeld = inputs.getKeyIsHeld(ModifierKey.Mod);

    return (
      <div
        className={`absolute bottom-10 left-10 opacity-80 flex flex-col ${!showDebug && "hidden"} pointer-events-auto bg-black h-fit border border-white`}
        style={{ top: `${y}px`, left: `${x}px`, zIndex: ZIndexLayers.DebugText }}
      >
        <div className="cursor-grab border-b border-white flex justify-between" ref={headerRef}>
          <h5 className="p-2 ">DEBUG</h5>
          <button
            className="h-full p-2 border-l border-white"
            onClick={() => {
              dialogs.close(DialogElementName.Debug);
              clientApplication.gameWorldView?.debug.hide();
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
          <li>Input Locked: {inputLockStatus}</li>
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
