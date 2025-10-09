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

  setIsOpen(elementName: DialogElementName, openState: boolean) {
    this.dialogOpenStates[elementName] = openState;
  }

  isOpen(elementName: DialogElementName) {
    return this.dialogOpenStates[elementName];
  }

  toggle(elementName: DialogElementName) {
    const toggled = !this.dialogOpenStates[elementName];
    this.dialogOpenStates[elementName] = toggled;
  }

  close(elementName: DialogElementName) {
    this.dialogOpenStates[elementName] = false;
  }
}

// Dialogs
// showDebug: boolean = false;
// viewingLeaveGameModal: boolean = false;
// viewingDropShardsModal: boolean = false;
// showAuthForm: boolean = false;
// showSavedCharacterManager: boolean = false;
// showGameCreationForm: boolean = false;
