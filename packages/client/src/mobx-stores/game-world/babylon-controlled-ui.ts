import { makeAutoObservable } from "mobx";

export class BabylonControlledCombatantData {
  debugHtml: string = "";
  constructor() {
    makeAutoObservable(this);
  }
}
