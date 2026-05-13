import { NextOrPrevious } from "@speed-dungeon/common";
import React from "react";
import { useClientApplication } from "@/hooks/create-client-application-context";
import { observer } from "mobx-react-lite";
import { HotkeyButton } from "@/app/components/atoms/HotkeyButton";
import { HotkeyButtonTypes } from "@/client-application/ui/keybind-config";

export const CycleFocusedCharacterButtons = observer(() => {
  const clientApplication = useClientApplication();
  const { uiStore, combatantFocus } = clientApplication;
  const { keybinds } = uiStore;

  function clickHandler(direction: NextOrPrevious) {
    combatantFocus.cycleFocusedCharacter(direction);
  }

  return (
    <ul className={`hidden`}>
      <HotkeyButton
        hotkeys={keybinds.getKeybind(HotkeyButtonTypes.CycleBackAlternate)}
        onClick={() => clickHandler(NextOrPrevious.Previous)}
        children={undefined}
      />
      <HotkeyButton
        hotkeys={keybinds.getKeybind(HotkeyButtonTypes.CycleForwardAlternate)}
        onClick={() => clickHandler(NextOrPrevious.Next)}
        children={undefined}
      />
    </ul>
  );
});
