"use client";
import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import { DEFAULT_KEYBIND_CODES, HotkeyButtonTypes } from "@/client-application/ui/keybind-config";
import { KEYBOARD_LAYOUT_STRINGS, KeyboardLayout } from "@/client-application/ui/keyboard-layouts";
import { SelectDropdown } from "@/app/components/atoms/SelectDropdown";
import { KeybindRow } from "./KeybindRow";
import { KeybindCaptureMode, useKeybindCapture } from "./use-keybind-capture";
import { LayoutChangeConfirmationModal } from "./LayoutChangeConfirmationModal";

export const KeybindsSection = observer(() => {
  const clientApplication = useClientApplication();
  const { keybinds } = clientApplication.uiStore;
  const { capturingButtonType, startCapture } = useKeybindCapture();
  const [pendingLayout, setPendingLayout] = useState<KeyboardLayout | null>(null);

  const layoutOptions = iterateNumericEnumKeyedRecord(KEYBOARD_LAYOUT_STRINGS).map(
    ([layout, title]) => ({ title, value: layout })
  );

  return (
    <div className="flex w-full h-full max-w-full">
      <ul className="max-w-[720px] min-w-[600px] flex-1 overflow-y-auto mr-4">
        {iterateNumericEnumKeyedRecord(DEFAULT_KEYBIND_CODES)
          .filter((element) => element[0] !== HotkeyButtonTypes.Cancel)
          .map(([buttonType]) => (
            <KeybindRow
              key={buttonType}
              buttonType={buttonType}
              isCapturing={capturingButtonType === buttonType}
              onAssign={() => {
                startCapture(buttonType, KeybindCaptureMode.Assign);
              }}
              onAdd={() => {
                startCapture(buttonType, KeybindCaptureMode.Add);
              }}
            />
          ))}
      </ul>
      <div className="min-w-[360px]">
        <div className="flex flex-col justify-between mb-2 ">
          <div className="mb-2">Keyboard layout (sets default suggestions)</div>
          <SelectDropdown
            key={`${keybinds.getSelectedLayout()}-${pendingLayout ?? "none"}`}
            title="keyboard layout"
            value={keybinds.getSelectedLayout()}
            setValue={(layout) => {
              if (layout !== keybinds.getSelectedLayout()) {
                setPendingLayout(layout as KeyboardLayout);
              }
            }}
            options={layoutOptions}
            disabled={false}
          />
        </div>
        <button
          className="h-10 mt-2 border border-slate-400 self-end px-4 hover:bg-slate-950"
          onClick={() => {
            keybinds.resetDefaults();
          }}
        >
          Reset all to defaults
        </button>
      </div>

      {pendingLayout !== null && (
        <LayoutChangeConfirmationModal
          layout={pendingLayout}
          onConfirm={() => {
            keybinds.setLayout(pendingLayout);
            setPendingLayout(null);
          }}
          onCancel={() => {
            setPendingLayout(null);
          }}
        />
      )}
    </div>
  );
});
