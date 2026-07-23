"use client";
import React from "react";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { ClickOutsideHandlerWrapper } from "@/app/components/atoms/ClickOutsideHandlerWrapper";
import { ZIndexLayers } from "@/app/z-index-layers";

interface Props {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmationModal({
  title,
  onConfirm,
  onCancel,
  children,
  confirmText = "Yes",
  cancelText = "No",
}: Props) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: ZIndexLayers.Tooltip }}
    >
      <ClickOutsideHandlerWrapper isActive={true} onClickOutside={onCancel}>
        <div className="max-w-96 p-8 border border-slate-400 bg-slate-950 pointer-events-auto">
          <h4 className="text-lg mb-1">{title}</h4>
          {children}
          <div className="flex justify-between">
            <HotkeyButton
              hotkeys={["Escape"]}
              onClick={onCancel}
              className="h-10 w-24 p-2 border border-slate-400 mr-1 bg-slate-700"
            >
              {cancelText}
            </HotkeyButton>
            <HotkeyButton onClick={onConfirm} className="h-10 w-24 p-2 border border-slate-400 ml-1">
              {confirmText}
            </HotkeyButton>
          </div>
        </div>
      </ClickOutsideHandlerWrapper>
    </div>
  );
}
