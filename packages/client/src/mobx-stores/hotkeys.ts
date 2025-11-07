"use client";
import { HOTKEYS } from "@/hotkeys";
import { iterateNumericEnumKeyedRecord } from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import { makeAutoObservable } from "mobx";
import { letterFromKeyCode } from "@/hotkeys";

export const VIEW_EQUIPMENT_HOTKEY = HOTKEYS.ALT_1;

export enum HotkeyButtonTypes {
  ToggleViewEquipment,
  UseItem,
  EquipAltSlot,
}

export type KeyCode = string;

export const DEFAULT_KEYBINDS: Record<HotkeyButtonTypes, KeyCode[]> = {
  [HotkeyButtonTypes.ToggleViewEquipment]: [HOTKEYS.ALT_1],
  [HotkeyButtonTypes.UseItem]: [HOTKEYS.MAIN_1],
  [HotkeyButtonTypes.EquipAltSlot]: [HOTKEYS.ALT_1],
};

export class HotkeysStore {
  private hotkeys = cloneDeep(DEFAULT_KEYBINDS);

  constructor() {
    makeAutoObservable(this);
    this.loadUserPreferences();
  }

  getKeybind(button: HotkeyButtonTypes): KeyCode[] {
    return this.hotkeys[button];
  }

  getKeybindString(button: HotkeyButtonTypes) {
    const hotkeys = this.getKeybind(button);
    if (hotkeys.length === 0) return "";
    return hotkeys.map((keycode) => letterFromKeyCode(keycode)).join(", ");
  }

  addKeybind(button: HotkeyButtonTypes, keycode: KeyCode) {
    const keys = this.hotkeys[button];
    if (!keys.includes(keycode)) {
      this.hotkeys[button] = [...keys, keycode];
      this.persistUserPreferences();
    }
  }

  setKeybind(button: HotkeyButtonTypes, keycode: KeyCode) {
    this.hotkeys[button] = [keycode];

    this.persistUserPreferences();
  }

  removeKeybind(button: HotkeyButtonTypes, keycode: KeyCode) {
    const keys = this.hotkeys[button].filter((k) => k !== keycode);
    this.hotkeys[button] = keys;
    this.persistUserPreferences();
  }

  resetKeybind(button: HotkeyButtonTypes) {
    this.hotkeys[button] = cloneDeep(DEFAULT_KEYBINDS[button]);

    this.persistUserPreferences();
  }

  resetDefaults() {
    const clonedDefaults = cloneDeep(DEFAULT_KEYBINDS);
    for (const [key, value] of iterateNumericEnumKeyedRecord(clonedDefaults)) {
      this.hotkeys[key] = value;
    }

    this.persistUserPreferences();
  }

  persistUserPreferences() {
    this.saveToLocalStorage();
    // later check if logged in and save to account settings
  }

  private saveToLocalStorage() {
    if (typeof window === "undefined") return;
    localStorage.setItem("keybinds", JSON.stringify(this.hotkeys));
  }

  loadUserPreferences() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    if (typeof window === "undefined") return;
    const data = localStorage.getItem("keybinds");
    if (!data) return console.info("no keybinds to load");

    try {
      const loaded = JSON.parse(data) as Record<HotkeyButtonTypes, KeyCode[]>;
      for (const [key, value] of iterateNumericEnumKeyedRecord(loaded)) {
        this.hotkeys[key] = value;
      }
    } catch (e) {
      console.error("failed to parse keybinds", e);
    }
  }
}
