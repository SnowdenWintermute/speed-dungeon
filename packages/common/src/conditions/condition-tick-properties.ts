import { makeAutoObservable } from "mobx";
import { ActionIntentAndUser } from "../action-processing/action-steps/index.js";
import { ActionUserContext } from "../action-user-context/index.js";
import { runIfInBrowser } from "../index.js";
import { CombatantCondition } from "./index.js";

export class ConditionTickProperties {
  constructor(
    public getAverageTurnsBetweenTicks: (condition: CombatantCondition) => number,
    public stacksRemovedOnTickCount: number,
    public onTick: (context: ActionUserContext) => {
      triggeredAction: {
        actionIntentAndUser: ActionIntentAndUser;
        getConsumableType?: () => null;
      };
    }
  ) {
    runIfInBrowser(() => makeAutoObservable(this));
  }
}
