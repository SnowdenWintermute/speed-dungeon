import React from "react";
import { HOTKEYS } from "@/hotkeys";
import { AppStore } from "@/mobx-stores/app-store";
import { IconName, SVG_ICONS } from "@/app/icons";
import ActionMenuTopButton from "./ActionMenuTopButton";

export const hotkey = HOTKEYS.CANCEL;

export default function GoBackButton({
  extraHotkeys,
  extraFn,
}: {
  extraHotkeys?: string[];
  extraFn?: () => void;
}) {
  return (
    <ActionMenuTopButton
      handleClick={() => {
        const { actionMenuStore, focusStore } = AppStore.get();
        actionMenuStore.clearHoveredAction();
        if (extraFn) extraFn();
        actionMenuStore.popStack();
      }}
      hotkeys={[hotkey, ...(extraHotkeys || [])]}
    >
      <div className="h-10 w-10 flex justify-center">
        {SVG_ICONS[IconName.Chevron]("h-full p-2 fill-zinc-300")}
      </div>
    </ActionMenuTopButton>
  );
}
