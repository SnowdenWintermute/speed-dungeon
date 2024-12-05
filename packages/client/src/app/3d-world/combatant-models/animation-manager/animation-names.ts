import { CombatAction, CombatActionType, AbilityName } from "@speed-dungeon/common";

export const ANIMATION_NAMES = {
  MOVE_FORWARD: "move-forward",
  MOVE_BACK: "move-back",
  IDLE: "idle",
  IDLE_GRIPPING: "idle-sword",
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
        case AbilityName.Attack:
        case AbilityName.AttackMeleeMainhand:
          return "melee-attack";
        case AbilityName.AttackMeleeOffhand:
          return "melee-attack-offhand";
        case AbilityName.AttackRangedMainhand:
          return "ranged-attack";
        case AbilityName.Fire:
        case AbilityName.Ice:
        case AbilityName.Healing:
          return "cast-spell";
      }
    case CombatActionType.ConsumableUsed:
      return "use-item";
  }
}
