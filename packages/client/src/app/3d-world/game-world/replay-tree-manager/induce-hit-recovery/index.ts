import {
  SkeletalAnimationName,
  CombatantProperties,
  ERROR_MESSAGES,
  ResourceChange,
  SpeedDungeonGame,
  ActionPayableResource,
  CombatActionName,
  COMBAT_ACTIONS,
  ActionResolutionStepType,
  CombatActionOrigin,
} from "@speed-dungeon/common";
import { getCombatantContext, useGameStore } from "@/stores/game-store";
import { CombatLogMessage, CombatLogMessageStyle } from "@/app/game/combat-log/combat-log-message";
import { useUIStore } from "@/stores/ui-store";
import { postResourceChangeToCombatLog } from "./post-resource-change-to-combat-log";
import { GameWorld } from "../..";
import { startResourceChangeFloatingMessage } from "./start-resource-change-floating-message";

export function induceHitRecovery(
  gameWorld: GameWorld,
  actionUserName: string,
  actionUserId: string,
  actionName: CombatActionName,
  actionStep: ActionResolutionStepType,
  resourceChange: ResourceChange,
  resourceType: ActionPayableResource,
  targetId: string,
  wasBlocked: boolean,
  shouldAnimate: boolean
) {
  const targetModel = gameWorld.modelManager.combatantModels[targetId];
  if (targetModel === undefined) return console.error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);

  const action = COMBAT_ACTIONS[actionName];
  const wasSpell = action.origin === CombatActionOrigin.SpellCast;

  // HANDLE RESOURCE CHANGES
  // - show a hit recovery or death animation (if mana, only animate if there wasn't an hp change animation already)
  // - start a floating message
  // - determine and post combat log text
  // - change their resource
  // HP ONLY:
  // - determine if died or resurrected
  // - handle any death by removing the affected combatant's turn tracker
  // - handle any ressurection by adding the affected combatant's turn tracker
  // MANA ONLY:
  // - show mana shield breaking if reduced to zero
  startResourceChangeFloatingMessage(targetId, resourceChange, resourceType, wasBlocked, 2000);

  const showDebug = useUIStore.getState().showDebug;

  useGameStore.getState().mutateState((gameState) => {
    const combatantContextResult = getCombatantContext(gameState, targetId);
    if (combatantContextResult instanceof Error) throw combatantContextResult;
    const { game, party, combatant } = combatantContextResult;
    const { combatantProperties } = combatant;

    const combatantWasAliveBeforeResourceChange = combatantProperties.hitPoints > 0;
    if (resourceType === ActionPayableResource.HitPoints)
      CombatantProperties.changeHitPoints(combatantProperties, resourceChange.value);
    if (resourceType === ActionPayableResource.Mana)
      CombatantProperties.changeMana(combatantProperties, resourceChange.value);

    postResourceChangeToCombatLog(
      gameState,
      resourceChange,
      resourceType,
      wasSpell,
      wasBlocked,
      combatant,
      actionUserName,
      actionUserId,
      showDebug
    );

    if (!shouldAnimate) return;

    if (combatantProperties.hitPoints <= 0) {
      const maybeError = SpeedDungeonGame.handleCombatantDeath(game, party.battleId, targetId);
      if (maybeError instanceof Error) return console.error(maybeError);

      gameState.combatLogMessages.push(
        new CombatLogMessage(
          `${combatant.entityProperties.name}'s hp was reduced to zero`,
          CombatLogMessageStyle.Basic
        )
      );

      targetModel.skeletalAnimationManager.startAnimationWithTransition(
        SkeletalAnimationName.DeathBack,
        0,
        {
          onComplete: () => {
            targetModel.skeletalAnimationManager.locked = true;
          },
        }
      );
    } else if (resourceChange.value < 0) {
      const hasCritRecoveryAnimation = targetModel.skeletalAnimationManager.getAnimationGroupByName(
        SkeletalAnimationName.HitRecovery
      );
      let animationName = SkeletalAnimationName.HitRecovery;
      if (resourceChange.isCrit && hasCritRecoveryAnimation)
        animationName = SkeletalAnimationName.CritRecovery;
      if (wasBlocked) animationName = SkeletalAnimationName.Block;

      targetModel.skeletalAnimationManager.startAnimationWithTransition(animationName, 0, {
        onComplete: () => {
          if (!combatantWasAliveBeforeResourceChange && combatantProperties.hitPoints > 0) {
            // - @todo - handle any ressurection by adding the affected combatant's turn tracker back into the battle
          } else {
            targetModel.startIdleAnimation(500);
          }
        },
      });
    }
  });
}
