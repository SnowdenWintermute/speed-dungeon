import React from "react";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { IconName, SVG_ICONS } from "@/app/icons";
import ActionMenuTopButton from "./ActionMenuTopButton";
import { HOTKEYS } from "@/client-application/ui/keybind-config";

export default function GoBackButton({
  extraHotkeys,
  extraFn,
}: {
  extraHotkeys?: string[];
  extraFn?: () => void;
}) {
  const clientApplication = useClientApplication();
  const { actionMenu, detailableEntityFocus } = clientApplication;
  return (
    <ActionMenuTopButton
      handleClick={() => {
        detailableEntityFocus.combatantAbilities.clear();
        detailableEntityFocus.detailables.clearHovered();

        if (extraFn) extraFn();
        actionMenu.popStack();
      }}
      hotkeys={[HOTKEYS.CANCEL, ...(extraHotkeys || [])]}
    >
      <div className="h-10 w-10 flex justify-center">
        {SVG_ICONS[IconName.Chevron]("h-full p-2 fill-zinc-300")}
      </div>
    </ActionMenuTopButton>
  );
}
