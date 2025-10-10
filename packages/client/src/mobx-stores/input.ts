import { makeAutoObservable } from "mobx";

export class InputStore {
  modKeyHeld: boolean = false;
  alternateClickKeyHeld: boolean = false;
  hotkeysDisabled: boolean = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }
}
