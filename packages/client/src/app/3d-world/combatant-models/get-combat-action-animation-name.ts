import { CombatAction, CombatActionType, CombatantAbilityName } from "@speed-dungeon/common";

export default function getCombatActionAnimationName(combatAction: CombatAction) {
  switch (combatAction.type) {
    case CombatActionType.AbilityUsed:
      switch (combatAction.abilityName) {
        case CombatantAbilityName.Attack:
        case CombatantAbilityName.AttackMeleeMainhand:
          return "melee-attack";
        case CombatantAbilityName.AttackMeleeOffhand:
          return "melee-attack-offhand";
        case CombatantAbilityName.AttackRangedMainhand:
          return "ranged-attack";
        case CombatantAbilityName.Fire:
        case CombatantAbilityName.Ice:
        case CombatantAbilityName.Healing:
          return "cast-spell";
      }
    case CombatActionType.ConsumableUsed:
      return "use-item";
  }
}
