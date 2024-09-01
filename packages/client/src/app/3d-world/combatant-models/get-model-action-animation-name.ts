import { MutateState } from "@/stores/mutate-state";
import { CombatantModelAction, CombatantModelActionType } from "./model-actions";
import { GameState } from "@/stores/game-store";
import {
  CombatActionType,
  CombatantAbilityName,
  CombatantDetails,
  ERROR_MESSAGES,
  SpeedDungeonGame,
} from "@speed-dungeon/common";

export const ANIMATION_NAMES = {
  MOVE_FORWARD: "move-forward",
  MOVE_BACK: "move-back",
  IDLE: "idle",
  DEATH: "death",
  HIT_RECOVERY: "hit-recovery",
  MELEE_MAIN_HAND: "melee-attack",
  MELEE_OFF_HAND: "melee-attack-offhand",
  RANGED_ATTACK: "ranged-attack",
  CAST_SPELL: "cast-spell",
  USE_ITEM: "use-item",
};

export default function getModelActionAnimationName(
  modelAction: CombatantModelAction,
  combatantId: string,
  mutateGameState: MutateState<GameState>
): Error | string {
  // this is so we can set values from inside the mutateGameState since you can't
  // set a primative from inside there, only the property of something passed by
  // reference
  const container: { maybeError: null | Error; combatantDetails: null | CombatantDetails } = {
    maybeError: null,
    combatantDetails: null,
  };

  mutateGameState((state) => {
    if (!state.game) return (container.maybeError = new Error(ERROR_MESSAGES.GAME_DOESNT_EXIST));

    const combatantResult = SpeedDungeonGame.getCombatantById(state.game, combatantId);
    if (combatantResult instanceof Error) return (container.maybeError = combatantResult);
    container.combatantDetails = combatantResult;
  });
  if (container.maybeError instanceof Error) return container.maybeError;

  // @todo - based on species (if humanoid) show different attack animations
  // for different weapons
  // const { combatantSpecies } = container.combatantDetails!.combatantProperties;

  switch (modelAction.type) {
    case CombatantModelActionType.ApproachDestination:
      return "move-forward";
    case CombatantModelActionType.ReturnHome:
      return "move-back";
    case CombatantModelActionType.TurnToTowardTarget:
      return "idle";
    case CombatantModelActionType.PerformCombatAction:
      switch (modelAction.actionResult.action.type) {
        case CombatActionType.AbilityUsed:
          switch (modelAction.actionResult.action.abilityName) {
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
    case CombatantModelActionType.HitRecovery:
      // @todo - based on damage percent of total life, show crit recovery
      return "hit-recovery";
    case CombatantModelActionType.Evade:
      return "evade";
    case CombatantModelActionType.Death:
      return "death";
    case CombatantModelActionType.Idle:
      // @todo - based on equipment, choose correct idle pose
      // @todo - based hp percent, choose correct limping idle pose
      return "idle";
    case CombatantModelActionType.EndTurn:
      return "";
  }
}
