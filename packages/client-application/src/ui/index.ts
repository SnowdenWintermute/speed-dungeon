import { FormsStore } from "./forms";
import { UiConfig } from "./config";
import { ConnectionStatusStore } from "./connection-status";
import { DialogStore } from "./dialogs";
import { TooltipStore } from "./tooltips";
import { InputStore } from "./inputs";
import { KeybindConfig } from "./keybind-config";
import { HttpRequestStore } from "./http-requests";
import { makeAutoObservable } from "mobx";
import { Milliseconds } from "@speed-dungeon/common";
import { ClientApplication } from "..";

export class UiStore {
  readonly httpRequests: HttpRequestStore;

  constructor(clientApplication: ClientApplication) {
    this.httpRequests = new HttpRequestStore(clientApplication);
    makeAutoObservable(this);
  }

  readonly config = new UiConfig();
  readonly connectionStatus = new ConnectionStatusStore();
  readonly dialogs = new DialogStore();
  readonly forms = new FormsStore();
  readonly tooltips = new TooltipStore();
  readonly inputs = new InputStore();
  readonly keybinds = new KeybindConfig();

  // for users who reconnect during a replay, we show them the resolution
  // but they should wait until input unlocks and see an explanation
  public replayResolutionTimeoutDuration: Milliseconds = 0;
}
