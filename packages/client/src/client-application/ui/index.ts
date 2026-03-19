import { FormsStore } from "./forms";
import { UiConfig } from "./config";
import { ConnectionStatusStore } from "./connection-status";
import { DialogStore } from "./dialogs";
import { TooltipStore } from "./tooltips";
import { InputStore } from "./inputs";
import { KeybindConfig } from "./keybind-config";
import { AssetFetchProgressStore } from "./asset-fetch-progress";
import { HttpRequestStore } from "./http-requests";

export class UiStore {
  readonly config = new UiConfig();
  readonly connectionStatus = new ConnectionStatusStore();
  readonly dialogs = new DialogStore();
  readonly forms = new FormsStore();
  readonly tooltips = new TooltipStore();
  readonly inputs = new InputStore();
  readonly keybinds = new KeybindConfig();
  readonly assetFetchProgress = new AssetFetchProgressStore();
  readonly httpRequests = new HttpRequestStore();
}
