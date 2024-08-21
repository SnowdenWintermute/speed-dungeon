import { AnimationEvent } from "babylonjs";
import { CombatActionType, CombatantAbilityName, ERROR_MESSAGES } from "@speed-dungeon/common";
import { CombatantModelAction, CombatantModelActionType } from "./model-actions";
import { GameWorld } from "../game-world";
import { setDebugMessage } from "@/stores/game-store/babylon-controlled-combatant-data";
import getCombatantInGameById from "@speed-dungeon/common/src/game/get-combatant-in-game-by-id";

export default function setAnimationFrameEvents(
  gameWorld: GameWorld,
  modelAction: CombatantModelAction
) {
  if (modelAction.type !== CombatantModelActionType.PerformCombatAction)
    return new Error(ERROR_MESSAGES.CHECKED_EXPECTATION_FAILED);

  const { actionResult } = modelAction;

  let animationEventOption: null | AnimationEvent = null;
  switch (actionResult.action.type) {
    case CombatActionType.AbilityUsed:
      switch (actionResult.action.abilityName) {
        case CombatantAbilityName.Attack:
        case CombatantAbilityName.AttackMeleeMainhand:
        // @todo - show offhand as different animation
        case CombatantAbilityName.AttackMeleeOffhand:
          animationEventOption = new AnimationEvent(
            30,
            () => {
              // induce hit recovery and evade animations
              //
              if (actionResult.hitPointChangesByEntityId)
                for (const [targetId, hpChange] of Object.entries(
                  actionResult.hitPointChangesByEntityId
                )) {
                  const isCrit = actionResult.critsByEntityId?.includes(targetId);
                  const targetModel = gameWorld.modelManager.combatantModels[targetId];
                  if (targetModel === undefined)
                    return console.error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
                  targetModel.modelActionQueue.push({
                    type: CombatantModelActionType.HitRecovery,
                    damage: hpChange,
                  });

                  setDebugMessage(gameWorld.mutateGameState, targetId, hpChange.toString(), 3000);

                  gameWorld.mutateGameState((gameState) => {
                    const gameOption = gameState.game;
                    if (!gameOption) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
                    const combatantResult = getCombatantInGameById(gameOption, targetId);
                    if (combatantResult instanceof Error) return console.error(combatantResult);

                    combatantResult.combatantProperties.hitPoints += hpChange;
                  });
                }

              if (actionResult.missesByEntityId)
                for (const targetId of actionResult.missesByEntityId) {
                  // push evade action
                  const targetModel = gameWorld.modelManager.combatantModels[targetId];
                  if (targetModel === undefined)
                    return console.error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);

                  targetModel.modelActionQueue.push({
                    type: CombatantModelActionType.Evade,
                  });

                  setDebugMessage(gameWorld.mutateGameState, targetId, "Evaded", 3000);
                }
            },
            true
          );
          break;
        case CombatantAbilityName.AttackRangedMainhand:
          break;
        // return "ranged-attack";
        case CombatantAbilityName.Fire:
        case CombatantAbilityName.Ice:
        case CombatantAbilityName.Healing:
          break;
        // return "cast-spell";
      }
    case CombatActionType.ConsumableUsed:
    // return "use-item";
  }

  return animationEventOption;
}
