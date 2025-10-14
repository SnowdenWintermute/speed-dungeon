import { makeAutoObservable } from "mobx";
import { FloatingMessage } from "./floating-messages";

export class BabylonControlledCombatantData {
  debugHtml: string = "";
  floatingMessages: FloatingMessage[] = [];
  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }
}
