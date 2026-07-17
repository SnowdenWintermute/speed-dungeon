"use client";
import React from "react";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import { DEFAULT_KEYBIND_CODES, HotkeyButtonTypes } from "@/client-application/ui/keybind-config";
import { KeybindRow } from "./KeybindRow";
import { useKeybindCapture } from "./use-keybind-capture";

export const KeybindsSection = observer(() => {
  const clientApplication = useClientApplication();
  const { keybinds } = clientApplication.uiStore;
  const { capturingFor, toggleCapture } = useKeybindCapture();

  return (
    <div className="flex flex-col" style={{ width: `450px` }}>
      <ul className="">
        {iterateNumericEnumKeyedRecord(DEFAULT_KEYBIND_CODES)
          .filter((element) => element[0] !== HotkeyButtonTypes.Cancel)
          .map(([buttonType]) => (
            <KeybindRow
              key={buttonType}
              buttonType={buttonType}
              isCapturing={capturingFor === buttonType}
              onRebindClick={() => {
                toggleCapture(buttonType);
              }}
            />
          ))}
      </ul>
      <button
        className="h-10 mt-2 border border-slate-400 self-end px-4 hover:bg-slate-950"
        onClick={() => {
          keybinds.resetDefaults();
        }}
      >
        Reset all to defaults
      </button>
    </div>
  );
});
