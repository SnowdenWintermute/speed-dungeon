import { DialogStore } from "./dialogs";

export class AppStore {
  dialogStore = new DialogStore();

  private static _instance: AppStore | null = null;

  static get(): AppStore {
    if (!AppStore._instance) AppStore._instance = new AppStore();
    return AppStore._instance;
  }
}
