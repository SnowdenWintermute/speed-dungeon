"use client";
import React from "react";
import { KEYBOARD_LAYOUT_STRINGS, KeyboardLayout } from "@/client-application/ui/keyboard-layouts";
import { ConfirmationModal } from "@/app/components/molocules/ConfirmationModal";

interface Props {
  layout: KeyboardLayout;
  onConfirm: () => void;
  onCancel: () => void;
}

export function LayoutChangeConfirmationModal({ layout, onConfirm, onCancel }: Props) {
  return (
    <ConfirmationModal
      title={`Change keyboard layout to ${KEYBOARD_LAYOUT_STRINGS[layout]}?`}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <p className="text-red-400 mb-1">
        This will overwrite all keybinds with the {KEYBOARD_LAYOUT_STRINGS[layout]} defaults,
        including any you set yourself.
      </p>
      <p className="mb-2">Really change layout?</p>
    </ConfirmationModal>
  );
}
