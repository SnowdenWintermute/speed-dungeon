"use client";
import React from "react";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { ClickOutsideHandlerWrapper } from "@/app/components/atoms/ClickOutsideHandlerWrapper";
import { ZIndexLayers } from "@/app/z-index-layers";
import { KEYBOARD_LAYOUT_STRINGS, KeyboardLayout } from "@/client-application/ui/keyboard-layouts";

interface Props {
  layout: KeyboardLayout;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LayoutChangeConfirmationModal({ layout, onConfirm, onCancel }: Props) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: ZIndexLayers.Tooltip }}
    >
      <ClickOutsideHandlerWrapper isActive={true} onClickOutside={onCancel}>
        <div className="max-w-96 p-8 border border-slate-400 bg-slate-950 pointer-events-auto">
          <h4 className="text-lg mb-1">
            Change keyboard layout to {KEYBOARD_LAYOUT_STRINGS[layout]}?
          </h4>
          <div className="mb-1">
            <p className="text-red-400">
              This will overwrite all keybinds with the {KEYBOARD_LAYOUT_STRINGS[layout]} defaults,
              including any you set yourself.
            </p>
          </div>
          <p className="mb-2">Really change layout?</p>
          <div className="flex justify-between">
            <HotkeyButton
              hotkeys={["Escape"]}
              onClick={onCancel}
              className="h-10 w-24 p-2 border border-slate-400 mr-1 bg-slate-700"
            >
              No
            </HotkeyButton>
            <HotkeyButton
              onClick={onConfirm}
              className="h-10 w-24 p-2 border border-slate-400 ml-1"
            >
              Yes
            </HotkeyButton>
          </div>
        </div>
      </ClickOutsideHandlerWrapper>
    </div>
  );
}
