"use client";
import React from "react";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import {
  HOTKEY_BUTTON_TYPE_STRINGS,
  HotkeyButtonTypes,
} from "@/client-application/ui/keybind-config";

interface Props {
  buttonType: HotkeyButtonTypes;
  isCapturing: boolean;
  onRebindClick: () => void;
}

export const KeybindRow = observer(({ buttonType, isCapturing, onRebindClick }: Props) => {
  const clientApplication = useClientApplication();
  const { keybinds } = clientApplication.uiStore;
  const boundKeys = keybinds.getKeybindString(buttonType);

  return (
    <li className="h-10 first:border-t border-l border-r border-b border-slate-400 flex items-center justify-between pl-2">
      <span>{HOTKEY_BUTTON_TYPE_STRINGS[buttonType]}</span>
      <div className="flex items-center h-full">
        <button
          className="h-full min-w-32 w-fit px-2 border-l border-slate-400 hover:bg-slate-950"
          onClick={onRebindClick}
        >
          {isCapturing ? "press a key… (Esc)" : boundKeys || "unbound"}
        </button>
        <button
          className="h-full px-2 border-l border-slate-400 hover:bg-slate-950"
          onClick={() => {
            keybinds.resetKeybind(buttonType);
          }}
        >
          Reset
        </button>
      </div>
    </li>
  );
});
