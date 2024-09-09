import { CombatAction, CombatActionType, CombatantAbilityName } from "@speed-dungeon/common";

export const ANIMATION_NAMES = {
  MOVE_FORWARD: "move-forward",
  MOVE_BACK: "move-back",
  IDLE: "idle",
  DEATH: "death",
  HIT_RECOVERY: "hit-recovery",
  EVADE: "evade",
  MELEE_MAIN_HAND: "melee-attack",
  MELEE_OFF_HAND: "melee-attack-offhand",
  RANGED_ATTACK: "ranged-attack",
  CAST_SPELL: "cast-spell",
  USE_ITEM: "use-item",
};

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
