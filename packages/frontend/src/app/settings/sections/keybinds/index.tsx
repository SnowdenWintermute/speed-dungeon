"use client";
import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import { DEFAULT_KEYBIND_CODES, HotkeyButtonTypes } from "@/client-application/ui/keybind-config";
import {
  KEYBOARD_LAYOUT_STRINGS,
  KeyboardLayout,
} from "@/client-application/ui/keyboard-layouts";
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
    <div className="flex flex-col" style={{ width: `450px` }}>
      <div className="flex items-center justify-between mb-2 h-10">
        <span>Keyboard layout (sets default suggestions)</span>
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
      <ul className="">
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
      <button
        className="h-10 mt-2 border border-slate-400 self-end px-4 hover:bg-slate-950"
        onClick={() => {
          keybinds.resetDefaults();
        }}
      >
        Reset all to defaults
      </button>

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
