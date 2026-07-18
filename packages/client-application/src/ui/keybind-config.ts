import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import { makeAutoObservable } from "mobx";
import {
  KeyboardLayout,
  keyValueForCode,
  keyValueToDisplayString,
  normalizeKeyValue,
} from "./keyboard-layouts";

export enum HotkeyButtonTypes {
  ToggleInventory,
  ToggleViewEquipment,
  EquipAltSlot,
  DropItem,
  ToggleViewingAbilityTree,
  AllocateAbilityPoint,
  CycleBack,
  CycleForward,
  CycleBackAlternate,
  CycleForwardAlternate,
  Confirm,
  Cancel,
  TakeAllItems,
  ViewItemsOnGround,
  ToggleAssignAttributesMenu,
  OpenConfirmConvertToShardMenu,
  CycleTargetingSchemes,
  QuickStartRace,
  QuickStartProgression,
  RefreshGameList,
  OpenCharacterManager,
  ToggleReady,
  ToggleCombatLog,
  ToggleDropShardsMenu,
  Explore,
  Descend,
  OperateVendingMachine,
  LeaveGame,
  CycleHotswapSlotBack,
  CycleHotswapSlotForward,
  ToggleDeletionConfirmation,
  ToggleDebugMenu,
  ToggleGameCreationForm,
  ActionMenuSlot1,
  ActionMenuSlot2,
  ActionMenuSlot3,
  ActionMenuSlot4,
  ActionMenuSlot5,
  ActionMenuSlot6,
}

// action-menu numbered slots, one per position on a page. Kept in sync with
// ACTION_MENU_PAGE_SIZE (asserted in action-menu/slot-keybinds.ts).
export const ACTION_MENU_SLOT_HOTKEY_BUTTON_TYPES: HotkeyButtonTypes[] = [
  HotkeyButtonTypes.ActionMenuSlot1,
  HotkeyButtonTypes.ActionMenuSlot2,
  HotkeyButtonTypes.ActionMenuSlot3,
  HotkeyButtonTypes.ActionMenuSlot4,
  HotkeyButtonTypes.ActionMenuSlot5,
  HotkeyButtonTypes.ActionMenuSlot6,
];

export const HOTKEY_BUTTON_TYPE_STRINGS: Record<HotkeyButtonTypes, string> = {
  [HotkeyButtonTypes.ToggleInventory]: "Toggle inventory",
  [HotkeyButtonTypes.ToggleViewEquipment]: "Toggle equipment view",
  [HotkeyButtonTypes.EquipAltSlot]: "Equip alternate slot",
  [HotkeyButtonTypes.DropItem]: "Drop item",
  [HotkeyButtonTypes.ToggleViewingAbilityTree]: "Toggle ability tree",
  [HotkeyButtonTypes.AllocateAbilityPoint]: "Allocate ability point",
  [HotkeyButtonTypes.CycleBack]: "Cycle back",
  [HotkeyButtonTypes.CycleForward]: "Cycle forward",
  [HotkeyButtonTypes.CycleBackAlternate]: "Cycle back (alternate)",
  [HotkeyButtonTypes.CycleForwardAlternate]: "Cycle forward (alternate)",
  [HotkeyButtonTypes.Confirm]: "Confirm",
  [HotkeyButtonTypes.Cancel]: "Cancel",
  [HotkeyButtonTypes.TakeAllItems]: "Take all items",
  [HotkeyButtonTypes.ViewItemsOnGround]: "View items on ground",
  [HotkeyButtonTypes.ToggleAssignAttributesMenu]: "Toggle assign attributes menu",
  [HotkeyButtonTypes.OpenConfirmConvertToShardMenu]: "Convert to shards",
  [HotkeyButtonTypes.CycleTargetingSchemes]: "Cycle targeting schemes",
  [HotkeyButtonTypes.QuickStartRace]: "Quick start race",
  [HotkeyButtonTypes.QuickStartProgression]: "Quick start progression",
  [HotkeyButtonTypes.RefreshGameList]: "Refresh game list",
  [HotkeyButtonTypes.OpenCharacterManager]: "Open character manager",
  [HotkeyButtonTypes.ToggleReady]: "Toggle ready",
  [HotkeyButtonTypes.ToggleCombatLog]: "Toggle combat log",
  [HotkeyButtonTypes.ToggleDropShardsMenu]: "Toggle drop-shards menu",
  [HotkeyButtonTypes.Explore]: "Explore next room / vote to stay",
  [HotkeyButtonTypes.Descend]: "Vote to descend",
  [HotkeyButtonTypes.OperateVendingMachine]: "Operate vending machine",
  [HotkeyButtonTypes.LeaveGame]: "Leave game",
  [HotkeyButtonTypes.CycleHotswapSlotBack]: "Cycle hotswap slot back",
  [HotkeyButtonTypes.CycleHotswapSlotForward]: "Cycle hotswap slot forward",
  [HotkeyButtonTypes.ToggleDeletionConfirmation]: "Toggle deletion confirmation",
  [HotkeyButtonTypes.ToggleDebugMenu]: "Toggle debug menu",
  [HotkeyButtonTypes.ToggleGameCreationForm]: "Toggle game creation form",
  [HotkeyButtonTypes.ActionMenuSlot1]: "Action menu slot 1",
  [HotkeyButtonTypes.ActionMenuSlot2]: "Action menu slot 2",
  [HotkeyButtonTypes.ActionMenuSlot3]: "Action menu slot 3",
  [HotkeyButtonTypes.ActionMenuSlot4]: "Action menu slot 4",
  [HotkeyButtonTypes.ActionMenuSlot5]: "Action menu slot 5",
  [HotkeyButtonTypes.ActionMenuSlot6]: "Action menu slot 6",
};

export type KeyCode = string;

// physical codes whose per-layout produced values seed the suggested defaults
export const DEFAULT_KEYBIND_CODES: Record<HotkeyButtonTypes, KeyCode[]> = {
  [HotkeyButtonTypes.ToggleInventory]: ["KeyF", "KeyI"],
  [HotkeyButtonTypes.ToggleViewEquipment]: ["KeyR"],
  [HotkeyButtonTypes.EquipAltSlot]: ["KeyR"],
  [HotkeyButtonTypes.DropItem]: ["KeyA"],
  [HotkeyButtonTypes.ToggleViewingAbilityTree]: ["KeyV"],
  [HotkeyButtonTypes.AllocateAbilityPoint]: ["KeyF"],
  [HotkeyButtonTypes.CycleBack]: ["KeyS"],
  [HotkeyButtonTypes.CycleForward]: ["KeyD"],
  [HotkeyButtonTypes.Confirm]: ["KeyF"],
  [HotkeyButtonTypes.Cancel]: ["Escape"],
  [HotkeyButtonTypes.TakeAllItems]: ["KeyA"],
  [HotkeyButtonTypes.ViewItemsOnGround]: ["KeyR"],
  [HotkeyButtonTypes.ToggleAssignAttributesMenu]: ["KeyA"],
  [HotkeyButtonTypes.CycleBackAlternate]: ["KeyW"],
  [HotkeyButtonTypes.CycleForwardAlternate]: ["KeyE"],
  [HotkeyButtonTypes.OpenConfirmConvertToShardMenu]: ["KeyT"],
  [HotkeyButtonTypes.CycleTargetingSchemes]: ["KeyA"],
  [HotkeyButtonTypes.QuickStartRace]: ["KeyG"],
  [HotkeyButtonTypes.QuickStartProgression]: ["KeyF"],
  [HotkeyButtonTypes.RefreshGameList]: ["KeyR"],
  [HotkeyButtonTypes.OpenCharacterManager]: ["KeyS"],
  [HotkeyButtonTypes.ToggleReady]: ["KeyG"],
  [HotkeyButtonTypes.ToggleCombatLog]: ["KeyL"],
  [HotkeyButtonTypes.ToggleDropShardsMenu]: ["KeyA"],
  [HotkeyButtonTypes.Explore]: ["KeyG"],
  [HotkeyButtonTypes.Descend]: ["KeyT"],
  [HotkeyButtonTypes.OperateVendingMachine]: ["KeyT"],
  [HotkeyButtonTypes.LeaveGame]: ["KeyG"],
  [HotkeyButtonTypes.CycleHotswapSlotBack]: ["KeyX"],
  [HotkeyButtonTypes.CycleHotswapSlotForward]: ["KeyC"],
  [HotkeyButtonTypes.ToggleDeletionConfirmation]: ["KeyR"],
  [HotkeyButtonTypes.ToggleDebugMenu]: ["KeyP"],
  [HotkeyButtonTypes.ToggleGameCreationForm]: ["KeyA"],
  [HotkeyButtonTypes.ActionMenuSlot1]: ["Digit1"],
  [HotkeyButtonTypes.ActionMenuSlot2]: ["Digit2"],
  [HotkeyButtonTypes.ActionMenuSlot3]: ["Digit3"],
  [HotkeyButtonTypes.ActionMenuSlot4]: ["Digit4"],
  [HotkeyButtonTypes.ActionMenuSlot5]: ["Digit5"],
  [HotkeyButtonTypes.ActionMenuSlot6]: ["Digit6"],
};

const KEYBINDS_STORAGE_KEY = "keybinds";
const KEYBIND_LAYOUT_STORAGE_KEY = "keybindLayout";

export class KeybindConfig {
  private selectedLayout: KeyboardLayout = KeyboardLayout.Qwerty;
  private hotkeys: Record<HotkeyButtonTypes, string[]>;

  constructor() {
    this.hotkeys = this.deriveDefaults(this.selectedLayout);
    makeAutoObservable(this);
    this.loadUserPreferences();
  }

  private deriveDefaults(layout: KeyboardLayout): Record<HotkeyButtonTypes, string[]> {
    const result = cloneDeep(DEFAULT_KEYBIND_CODES);
    for (const [button, codes] of iterateNumericEnumKeyedRecord(DEFAULT_KEYBIND_CODES)) {
      result[button] = codes.map((code) => keyValueForCode(code, layout));
    }
    return result;
  }

  getSelectedLayout(): KeyboardLayout {
    return this.selectedLayout;
  }

  setLayout(layout: KeyboardLayout) {
    this.selectedLayout = layout;
    this.hotkeys = this.deriveDefaults(layout);
    this.persistUserPreferences();
  }

  getKeybind(button: HotkeyButtonTypes): string[] {
    return this.hotkeys[button];
  }

  getKeybindDisplayStrings(button: HotkeyButtonTypes): string[] {
    return this.getKeybind(button).map(keyValueToDisplayString);
  }

  getKeybindString(button: HotkeyButtonTypes): string {
    return this.getKeybindDisplayStrings(button).join(", ");
  }

  addKeybind(button: HotkeyButtonTypes, key: string) {
    const value = normalizeKeyValue(key);
    const keys = this.hotkeys[button];
    if (!keys.includes(value)) {
      this.hotkeys[button] = [...keys, value];
      this.persistUserPreferences();
    }
  }

  setKeybind(button: HotkeyButtonTypes, key: string) {
    this.hotkeys[button] = [normalizeKeyValue(key)];
    this.persistUserPreferences();
  }

  removeKeybind(button: HotkeyButtonTypes, key: string) {
    const value = normalizeKeyValue(key);
    this.hotkeys[button] = this.hotkeys[button].filter((k) => k !== value);
    this.persistUserPreferences();
  }

  resetKeybind(button: HotkeyButtonTypes) {
    this.hotkeys[button] = this.deriveDefaults(this.selectedLayout)[button];
    this.persistUserPreferences();
  }

  resetDefaults() {
    this.hotkeys = this.deriveDefaults(this.selectedLayout);
    this.persistUserPreferences();
  }

  persistUserPreferences() {
    this.saveToLocalStorage();
    // later check if logged in and save to account settings
  }

  private saveToLocalStorage() {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEYBINDS_STORAGE_KEY, JSON.stringify(this.hotkeys));
    localStorage.setItem(KEYBIND_LAYOUT_STORAGE_KEY, JSON.stringify(this.selectedLayout));
  }

  loadUserPreferences() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    if (typeof window === "undefined") return;

    const layoutData = localStorage.getItem(KEYBIND_LAYOUT_STORAGE_KEY);
    if (layoutData) {
      try {
        this.selectedLayout = JSON.parse(layoutData) as KeyboardLayout;
        this.hotkeys = this.deriveDefaults(this.selectedLayout);
      } catch (e) {
        console.error("failed to parse keybind layout", e);
      }
    }

    const data = localStorage.getItem(KEYBINDS_STORAGE_KEY);
    if (!data) return console.info("no keybinds to load");

    try {
      const loaded = JSON.parse(data) as Record<HotkeyButtonTypes, string[]>;
      for (const [key, value] of iterateNumericEnumKeyedRecord(loaded)) {
        this.hotkeys[key] = value;
      }
    } catch (e) {
      console.error("failed to parse keybinds", e);
    }
  }
}
