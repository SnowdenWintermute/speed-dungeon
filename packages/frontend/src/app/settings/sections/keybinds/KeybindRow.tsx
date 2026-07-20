"use client";
import React from "react";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import {
  HOTKEY_BUTTON_TYPE_STRINGS,
  HotkeyButtonTypes,
} from "@/client-application/ui/keybind-config";
import { keyValueToDisplayString } from "@/client-application/ui/keyboard-layouts";

interface Props {
  buttonType: HotkeyButtonTypes;
  isCapturing: boolean;
  onAssign: () => void;
  onAdd: () => void;
}

export const KeybindRow = observer(({ buttonType, isCapturing, onAssign, onAdd }: Props) => {
  const clientApplication = useClientApplication();
  const { keybinds } = clientApplication.uiStore;
  const boundValues = keybinds.getKeybind(buttonType);

  return (
    <li className="min-h-10 first:border-t border-l border-r border-b border-slate-400 flex items-center justify-between pl-2">
      <span>{HOTKEY_BUTTON_TYPE_STRINGS[buttonType]}</span>
      <div className="flex items-stretch min-h-10">
        <div className="flex items-center flex-wrap gap-1 px-2 min-w-32 border-l border-slate-400 py-1">
          {isCapturing ? (
            <span className="italic">press a key… (Esc)</span>
          ) : boundValues.length === 0 ? (
            <span className="opacity-50">unbound</span>
          ) : (
            boundValues.map((value) => (
              <span
                key={value}
                className="flex items-center border border-slate-400 pl-2 pr-1 bg-slate-800"
              >
                {keyValueToDisplayString(value)}
                <button
                  className="ml-1 px-1 hover:text-red-400"
                  aria-label={`remove ${keyValueToDisplayString(value)}`}
                  onClick={() => {
                    keybinds.removeKeybind(buttonType, value);
                  }}
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        <button className="px-2 border-l border-slate-400 hover:bg-slate-950" onClick={onAdd}>
          Add
        </button>
        <button className="px-2 border-l border-slate-400 hover:bg-slate-950" onClick={onAssign}>
          Assign
        </button>
        <button
          className="px-2 border-l border-slate-400 hover:bg-slate-950"
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
