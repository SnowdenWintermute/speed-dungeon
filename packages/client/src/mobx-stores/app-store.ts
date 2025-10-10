import { DialogStore } from "./dialogs";
import { LobbyStore } from "./lobby";

export class AppStore {
  dialogStore = new DialogStore();
  lobbyStore = new LobbyStore();

  private static _instance: AppStore | null = null;

  static get(): AppStore {
    if (!AppStore._instance) AppStore._instance = new AppStore();
    return AppStore._instance;
  }
}
