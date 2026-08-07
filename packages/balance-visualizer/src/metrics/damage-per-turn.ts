import {
  COMBAT_ACTIONS,
  CombatActionName,
  Combatant,
  CombatantEquipment,
} from "@speed-dungeon/common";
import { ExpectedDamageCalculator } from "./expected-damage";

const BASIC_ATTACK_RANK = 1;

/** Attacks per turn come from the same predicates the game gates the off-hand attack with, in
 * attack-melee-main-hand's requiresCombatTurnInThisContext: a usable shield or two-handed melee
 * weapon consumes the turn, so both cost the off-hand attack entirely. */
export class DamagePerTurnCalculator {
  constructor(private readonly expectedDamage: ExpectedDamageCalculator) {}

  against(user: Combatant, target: Combatant): number {
    let total = 0;
    for (const actionName of DamagePerTurnCalculator.attacksInATurn(user)) {
      total += this.expectedDamage.against(
        COMBAT_ACTIONS[actionName],
        BASIC_ATTACK_RANK,
        user,
        target
      );
    }
    return total;
  }

  static attacksInATurn(user: Combatant): CombatActionName[] {
    if (CombatantEquipment.isWearingUsableTwoHandedRangedWeapon(user)) {
      return [CombatActionName.AttackRangedMainhand];
    }
    if (CombatantEquipment.isWearingUsableTwoHandedMeleeWeapon(user)) {
      return [CombatActionName.AttackMeleeMainhand];
    }
    if (CombatantEquipment.isWearingUsableShield(user)) {
      return [CombatActionName.AttackMeleeMainhand];
    }
    return [CombatActionName.AttackMeleeMainhand, CombatActionName.AttackMeleeOffhand];
  }
}
