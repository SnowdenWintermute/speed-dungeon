import { invariant } from "@speed-dungeon/common";
import {
  ACTION_MENU_SLOT_HOTKEY_BUTTON_TYPES,
  HotkeyButtonTypes,
  KeybindConfig,
} from "../ui/keybind-config";
import { keyValueToDisplayString, numberKeyValue } from "../ui/keyboard-layouts";
import { ACTION_MENU_PAGE_SIZE } from "./consts";

invariant(
  ACTION_MENU_SLOT_HOTKEY_BUTTON_TYPES.length === ACTION_MENU_PAGE_SIZE,
  "ACTION_MENU_SLOT_HOTKEY_BUTTON_TYPES must have one entry per action-menu page slot"
);

function slotHotkeyButtonType(slotNumber: number): HotkeyButtonTypes | undefined {
  return ACTION_MENU_SLOT_HOTKEY_BUTTON_TYPES[slotNumber - 1];
}

// resolves a numbered action-menu slot to its configurable keybind values.
// slot numbers beyond the page size fall back to the fixed digit value.
export function getActionMenuSlotHotkeys(keybinds: KeybindConfig, slotNumber: number): string[] {
  const buttonType = slotHotkeyButtonType(slotNumber);
  if (buttonType === undefined) {
    return [numberKeyValue(slotNumber)];
  }
  return keybinds.getKeybind(buttonType);
}

export function getActionMenuSlotLabel(keybinds: KeybindConfig, slotNumber: number): string {
  return keyValueToDisplayString(getActionMenuSlotHotkeys(keybinds, slotNumber)[0] ?? "");
}
