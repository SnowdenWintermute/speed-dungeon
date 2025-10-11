import { DialogStore } from "./dialogs";
import { FocusStore } from "./focus";
import { InputStore } from "./input";
import { LobbyStore } from "./lobby";
import { TooltipStore } from "./tooltip";

export class AppStore {
  dialogStore = new DialogStore();
  lobbyStore = new LobbyStore();
  tooltipStore = new TooltipStore();
  inputStore = new InputStore();
  focusStore = new FocusStore();

  private static _instance: AppStore | null = null;

  static get(): AppStore {
    if (!AppStore._instance) AppStore._instance = new AppStore();
    return AppStore._instance;
  }
}
