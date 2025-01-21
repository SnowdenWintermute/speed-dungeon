import { MaxAndCurrent } from "../../primatives";

export class CombatantCondition {
  stacks?: MaxAndCurrent;
  ticks?: MaxAndCurrent;
  constructor() {}

  onTick() {
    // if tracking ticks, increment current
    // examples of action to take here:
    // - cause resource change
    // - removeSelf
    // - modifySelf (ex: increase debuff strength)
  }

  triggeredBy() {
    // examples
    // - combatant uses ability
    // - combatant is attacked by fire
    // - "remove buff" spell is cast on combatant
    // - combatant switches equipment
  }

  onTriggered() {
    // examples:
    // - perform a composite combat action
    // - remove self - examples:
    // - ex: Poisona for a poison condition
    // - ex: Esuna for all negative conditions
    // - ex: Dispell for all positive conditions
  }

  getAvailableActionModifications() {
    // examples:
    // - can't cast spells
    // - allows attacking while dead
    // - restricts certain targets
  }

  getIntent() {
    // helpful (buff)
    // harmful (debuff)
    // neutral (neither)
  }

  attributeModifiers() {
    // - ex: blind reduces accuracy
    // - may be calculated to include stacks
  }
}
