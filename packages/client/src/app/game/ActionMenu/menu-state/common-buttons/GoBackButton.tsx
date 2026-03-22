import React from "react";
import { HOTKEYS } from "@/hotkeys";
import { useClientApplication } from "@/hooks/create-client-application-context";
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
        focusStore.combatantAbilities.clear();
        focusStore.detailables.clearHovered();

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
