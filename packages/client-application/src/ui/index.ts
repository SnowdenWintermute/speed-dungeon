import { FormsStore } from "./forms";
import { UiConfig } from "./config";
import { ConnectionStatusStore } from "./connection-status";
import { DialogStore } from "./dialogs";
import { TooltipStore } from "./tooltips";
import { InputStore } from "./inputs";
import { KeybindConfig } from "./keybind-config";
import { AssetFetchProgressStore } from "./asset-fetch-progress";
import { HttpRequestStore } from "./http-requests";
import { makeAutoObservable } from "mobx";
import { Milliseconds } from "@speed-dungeon/common";

export class UiStore {
  constructor() {
    makeAutoObservable(this);
  }

  readonly config = new UiConfig();
  readonly connectionStatus = new ConnectionStatusStore();
  readonly dialogs = new DialogStore();
  readonly forms = new FormsStore();
  readonly tooltips = new TooltipStore();
  readonly inputs = new InputStore();
  readonly keybinds = new KeybindConfig();
  readonly assetFetchProgress = new AssetFetchProgressStore();
  readonly httpRequests = new HttpRequestStore();

  // for users who reconnect during a replay, we show them the resolution
  // but they should wait until input unlocks and see an explanation
  public replayResolutionTimeoutDuration: Milliseconds = 0;
}
