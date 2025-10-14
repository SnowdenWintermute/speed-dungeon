import { ActionMenuStore } from "./action-menu";
import { DialogStore } from "./dialogs";
import { FocusStore } from "./focus";
import { GameWorldStore } from "./game-world";
import { InputStore } from "./input";
import { LobbyStore } from "./lobby";
import { TooltipStore } from "./tooltip";

export class AppStore {
  dialogStore = new DialogStore();
  lobbyStore = new LobbyStore();
  tooltipStore = new TooltipStore();
  inputStore = new InputStore();
  focusStore = new FocusStore();
  actionMenuStore = new ActionMenuStore();
  gameWorldStore = new GameWorldStore();

  private static _instance: AppStore | null = null;

  static get(): AppStore {
    if (!AppStore._instance) AppStore._instance = new AppStore();
    return AppStore._instance;
  }
}
