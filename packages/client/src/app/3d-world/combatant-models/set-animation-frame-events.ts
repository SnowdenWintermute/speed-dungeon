import { AnimationEvent } from "babylonjs";
import {
  ActionResult,
  CombatAction,
  CombatActionType,
  CombatantAbilityName,
  ERROR_MESSAGES,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { CombatantModelActionType } from "./model-actions";
import { GameWorld } from "../game-world";
import { FloatingTextColor, startFloatingText } from "@/stores/game-store/floating-text";

export default function getAnimationFrameEvents(
  gameWorld: GameWorld,
  combatAction: CombatAction,
  hpChanges: null | { [entityId: string]: { hpChange: number; isCrit: boolean } },
  mpChanges: null | { [entityId: string]: number },
  misses: string[]
) {
  let animationEventOption: null | AnimationEvent = null;
  switch (combatAction.type) {
    case CombatActionType.AbilityUsed:
      switch (combatAction.abilityName) {
        case CombatantAbilityName.Attack:
        case CombatantAbilityName.AttackMeleeMainhand:
        // @todo - select correct frames for various attack animations
        case CombatantAbilityName.AttackMeleeOffhand:
        case CombatantAbilityName.AttackRangedMainhand:
          animationEventOption = new AnimationEvent(
            20,
            () => {
              if (actionResult.hitPointChangesByEntityId)
                for (const [targetId, hpChange] of Object.entries(
                  actionResult.hitPointChangesByEntityId
                )) {
                  induceHitRecovery(gameWorld, actionResult, targetId, hpChange);
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

                  startFloatingText(
                    gameWorld.mutateGameState,
                    targetId,
                    "Evaded",
                    FloatingTextColor.Healing,
                    false,
                    2000
                  );
                }
            },
            true
          );
          break;
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

function induceHitRecovery(
  gameWorld: GameWorld,
  actionResult: ActionResult,
  targetId: string,
  hpChange: number
) {
  const targetModel = gameWorld.modelManager.combatantModels[targetId];
  if (targetModel === undefined) return console.error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);
  const isCrit = actionResult.critsByEntityId?.includes(targetId) ?? false;

  // clear model actions - @todo - handle incomplete actions
  for (const action of Object.values(targetModel.activeModelActions))
    targetModel.removeActiveModelAction(action.modelAction.type);

  targetModel.startModelAction(gameWorld.mutateGameState, {
    type: CombatantModelActionType.HitRecovery,
    damage: hpChange,
  });

  const color = hpChange >= 0 ? FloatingTextColor.Healing : FloatingTextColor.Damage;

  startFloatingText(
    gameWorld.mutateGameState,
    targetId,
    Math.abs(hpChange).toString(),
    color,
    isCrit,
    2000
  );

  gameWorld.mutateGameState((gameState) => {
    const gameOption = gameState.game;
    if (!gameOption) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const combatantResult = SpeedDungeonGame.getCombatantById(gameOption, targetId);
    if (combatantResult instanceof Error) return console.error(combatantResult);

    combatantResult.combatantProperties.hitPoints =
      combatantResult.combatantProperties.hitPoints + hpChange;
  });
}