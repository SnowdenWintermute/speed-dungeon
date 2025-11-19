import { NextOrPrevious, getNextOrPreviousNumber, iterateNumericEnum } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export class ConfigStore {
  private threatTableDisplayMode: UiDisplayMode = UiDisplayMode.Simple;

  constructor() {
    makeAutoObservable(this);
  }

  cycleThreatTableDisplayMode() {
    this.threatTableDisplayMode = getNextOrPreviousNumber(
      this.threatTableDisplayMode,
      iterateNumericEnum(UiDisplayMode).length - 1,
      NextOrPrevious.Next,
      { minNumber: 0 }
    );
  }

  getThreatTableDisplayMode() {
    return this.threatTableDisplayMode;
  }
}

export enum UiDisplayMode {
  Detailed,
  Simple,
  Sparse,
}

export const UI_DISPLAY_MODE_STRINGS: Record<UiDisplayMode, string> = {
  [UiDisplayMode.Detailed]: "Detailed",
  [UiDisplayMode.Simple]: "Simple",
  [UiDisplayMode.Sparse]: "Sparse",
};
