import makeAutoObservable from "mobx-store-inheritance";
import { CombatActionIntent } from "../../combat/combat-actions/index.js";
import {
  ActionUserContext,
  Combatant,
  CombatantCondition,
  IdGenerator,
  MaxAndCurrent,
  runIfInBrowser,
} from "../../index.js";
import { CombatantConditionInit } from "../condition-config.js";

export class EnsnaredCondition extends CombatantCondition {
  constructor(init: CombatantConditionInit) {
    super(init);
    runIfInBrowser(() => makeAutoObservable(this));
  }

  intent = CombatActionIntent.Malicious;
  stacksOption = new MaxAndCurrent(1, 1);
  removedOnDeath = true;
  multiplesAllowed = true;
  triggeredWhenHitBy = [];

  onTriggered(
    this: CombatantCondition,
    actionUserContext: ActionUserContext,
    targetCombatant: Combatant,
    idGenerator: IdGenerator
  ) {
    // { user: this, actionExecutionIntent }

    return {
      numStacksRemoved: this.stacksOption?.current || 1,
      triggeredActions: [],
    };
  }
}
