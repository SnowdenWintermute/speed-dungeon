import { DialogStore } from "./dialogs";
import { LobbyStore } from "./lobby";
import { TooltipStore } from "./tooltip";

export class AppStore {
  dialogStore = new DialogStore();
  lobbyStore = new LobbyStore();
  tooltipStore = new TooltipStore();

  private static _instance: AppStore | null = null;

  static get(): AppStore {
    if (!AppStore._instance) AppStore._instance = new AppStore();
    return AppStore._instance;
  }
}
