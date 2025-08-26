import { ActionMenuButtonProperties } from "..";
import { useGameStore } from "@/stores/game-store";
import { HOTKEYS } from "@/hotkeys";

export function createCancelButton(alternativeHotkeys: string[], extraFn?: () => void) {
  const cancelButton = new ActionMenuButtonProperties(
    () => "Cancel",
    "Cancel",
    () => {
      if (extraFn) extraFn();
      useGameStore.getState().mutateState((state) => {
        state.stackedMenuStates.pop();
      });
    }
  );
  cancelButton.dedicatedKeys = [HOTKEYS.CANCEL, ...alternativeHotkeys];
  return cancelButton;
}
