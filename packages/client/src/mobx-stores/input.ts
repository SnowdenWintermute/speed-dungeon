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

  private hotkeysDisabled: boolean = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  getHotkeysDisabled() {
    return this.hotkeysDisabled;
  }

  setHotkeysDisabled(disabled: boolean) {
    this.hotkeysDisabled = disabled;
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
