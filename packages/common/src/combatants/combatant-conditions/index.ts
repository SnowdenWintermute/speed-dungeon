import { CombatActionExecutionIntent } from "../../combat/combat-actions/combat-action-execution-intent.js";
import { CombatActionName } from "../../combat/combat-actions/combat-action-names.js";
import { EntityId, MaxAndCurrent } from "../../primatives/index.js";
import { Combatant } from "../index.js";

export enum CombatantConditionName {
  Poison,
  PrimedForExplosion,
}

export abstract class CombatantCondition {
  stacks?: MaxAndCurrent;
  ticks?: MaxAndCurrent;
  level: number = 0;
  constructor(
    public id: EntityId,
    public name: CombatantConditionName
  ) {}

  abstract onTick(): void;
  // if tracking ticks, increment current
  // examples of action to take here:
  // - cause resource change
  // - removeSelf
  // - modifySelf (ex: increase debuff strength)

  abstract triggeredWhenHitBy(actionName: CombatActionName): boolean;
  // examples
  // - combatant uses ability
  // - combatant is attacked by fire
  // - "remove buff" spell is cast on combatant
  // - combatant switches equipment

  abstract triggeredWhenActionUsed(): boolean;
  //

  abstract onTriggered(
    combatant: Combatant
  ): { user: Combatant; actionExecutionIntent: CombatActionExecutionIntent }[];
  // examples:
  // - perform a composite combat action
  // - remove self - examples:
  // - ex: Poisona for a poison condition
  // - ex: Esuna for all negative conditions
  // - ex: Dispell for all positive conditions

  // getAvailableActionModifications() {
  //   // examples:
  //   // - can't cast spells
  //   // - allows attacking while dead
  //   // - restricts certain targets
  // }

  // getIntent() {
  //   // helpful (buff)
  //   // harmful (debuff)
  //   // neutral (neither)
  // }

  // attributeModifiers() {
  //   // - may be calculated to include stacks
  // }
}
