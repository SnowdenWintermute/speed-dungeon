import { makeAutoObservable } from "mobx";
import { AppStore } from "./app-store";

export enum RuntimeMode {
  Online,
  Offline,
}

export class ApplicationRuntimeEnvironmentStore {
  private _mode = RuntimeMode.Online;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  enterOnline() {
    this._mode = RuntimeMode.Online;
  }

  enterOffline() {
    this._mode = RuntimeMode.Offline;
  }

  get canEnterOffline() {
    const { assetFetchProgressStore } = AppStore.get();
    const { initialized, isComplete } = assetFetchProgressStore;
    return initialized && isComplete;
  }

  get runtimeMode() {
    return this._mode;
  }

  get isOnline() {
    return this._mode === RuntimeMode.Online;
  }

  get isOffline() {
    return this._mode === RuntimeMode.Offline;
  }
}
