import { HOTKEYS } from "@/hotkeys";
import { AppStore } from "@/mobx-stores/app-store";
import { ActionMenuButtonProperties } from "../action-menu-button-properties";

export function createCancelButton(alternativeHotkeys: string[], extraFn?: () => void) {
  const cancelButton = new ActionMenuButtonProperties(
    () => "Cancel",
    "Cancel",
    () => {
      if (extraFn) extraFn();

      AppStore.get().actionMenuStore.popStack();
    }
  );
  cancelButton.dedicatedKeys = [HOTKEYS.CANCEL, ...alternativeHotkeys];
  return cancelButton;
}
