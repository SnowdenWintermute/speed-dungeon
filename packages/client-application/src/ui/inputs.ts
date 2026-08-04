import { makeAutoObservable } from "mobx";

export enum ModifierKey {
  Mod,
  AlternateClick,
}

export class InputStore {
  private modKeysHeld: Record<ModifierKey, boolean> = {
    [ModifierKey.Mod]: false,
    [ModifierKey.AlternateClick]: false,
  };

  constructor() {
    makeAutoObservable(this);
  }

  setKeyHeld(key: ModifierKey) {
    this.modKeysHeld[key] = true;
  }

  setKeyReleased(key: ModifierKey) {
    this.modKeysHeld[key] = false;
  }

  getKeyIsHeld(key: ModifierKey) {
    return this.modKeysHeld[key];
  }
}
