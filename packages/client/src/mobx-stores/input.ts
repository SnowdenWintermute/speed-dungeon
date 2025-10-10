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

  hotkeysDisabled: boolean = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
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
