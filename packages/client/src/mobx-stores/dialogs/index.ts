import { makeAutoObservable } from "mobx";

export enum DialogElementName {
  Debug,
  LeaveGame,
  AppSettings,
  DropShards,
  Credentials,
  SavedCharacterManager,
  GameCreation,
}

export class DialogStore {
  private dialogOpenStates: Record<DialogElementName, boolean> = {
    [DialogElementName.Debug]: false,
    [DialogElementName.LeaveGame]: false,
    [DialogElementName.AppSettings]: false,
    [DialogElementName.DropShards]: false,
    [DialogElementName.Credentials]: false,
    [DialogElementName.SavedCharacterManager]: false,
    [DialogElementName.GameCreation]: false,
  };

  public highlightAuthForm: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  setDialogIsOpen(elementName: DialogElementName, openState: boolean) {
    this.dialogOpenStates[elementName] = openState;
  }

  getDialogIsOpen(elementName: DialogElementName) {
    return this.dialogOpenStates[elementName];
  }
}

// Dialogs
// showDebug: boolean = false;
// viewingLeaveGameModal: boolean = false;
// showSettings: boolean = false;
// viewingDropShardsModal: boolean = false;
// showAuthForm: boolean = false;
// showSavedCharacterManager: boolean = false;
// showGameCreationForm: boolean = false;
