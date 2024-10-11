import { SPACING_REM, SPACING_REM_SMALL } from "@/client_consts";
import React from "react";
import HotkeyButton from "../components/atoms/HotkeyButton";
import XShape from "../../../public/img/basic-shapes/x-shape.svg";
import { useUIStore } from "@/stores/ui-store";

export default function Settings() {
  const mutateUIState = useUIStore().mutateState;
  const showSettings = useUIStore().showSettings;

  if (!showSettings) return <></>;

  return (
    <section
      className="absolute z-20 bg-slate-700 border border-slate-400 pointer-events-auto"
      style={{
        width: `calc(100% - ${SPACING_REM_SMALL}rem * 2)`,
        height: `calc(100% - ${SPACING_REM_SMALL}rem * 2)`,
        top: `${SPACING_REM_SMALL}rem`,
        right: `${SPACING_REM_SMALL}rem`,
      }}
    >
      <div className="h-10 w-full border-b border-slate-400 flex items-center justify-between">
        <span>Settings</span>
        <HotkeyButton
          className="p-2 h-full w-fit border cursor-pointer"
          hotkey="Escape"
          onClick={() =>
            mutateUIState((state) => {
              state.showSettings = false;
            })
          }
        >
          <XShape className="h-full w-full fill-slate-400" />
        </HotkeyButton>
      </div>
    </section>
  );
}
