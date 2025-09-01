import {
  SkeletalAnimationName,
  CombatantProperties,
  ERROR_MESSAGES,
  ResourceChange,
  ActionPayableResource,
  CombatActionName,
  COMBAT_ACTIONS,
  ActionResolutionStepType,
  AdventuringParty,
  FLOATING_MESSAGE_DURATION,
} from "@speed-dungeon/common";
import { getCombatantContext, useGameStore } from "@/stores/game-store";
import { CombatLogMessage, CombatLogMessageStyle } from "@/app/game/combat-log/combat-log-message";
import { useUIStore } from "@/stores/ui-store";
import { startResourceChangeFloatingMessage } from "./start-resource-change-floating-message";
import { getGameWorld } from "@/app/3d-world/SceneManager";
import { postResourceChangeToCombatLog } from "@/app/game/combat-log/post-resource-change-to-combat-log";

export function induceHitRecovery(
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
  const targetModel = getGameWorld().modelManager.findOneOptional(targetId);
  if (targetModel === undefined) return console.error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);

  startResourceChangeFloatingMessage(
    targetId,
    resourceChange,
    resourceType,
    wasBlocked,
    FLOATING_MESSAGE_DURATION
  );

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

    const action = COMBAT_ACTIONS[actionName];
    postResourceChangeToCombatLog(
      gameState,
      resourceChange,
      resourceType,
      action,
      wasBlocked,
      combatant,
      actionUserName,
      actionUserId,
      showDebug
    );

    const battleOption = AdventuringParty.getBattleOption(party, game);

    if (combatantProperties.hitPoints <= 0) {
      const combatantDiedOnTheirOwnTurn = (() => {
        if (battleOption === null) return false;
        return battleOption.turnOrderManager.combatantIsFirstInTurnOrder(targetId);
      })();

      battleOption?.turnOrderManager.updateTrackers(game, party);

      if (combatantDiedOnTheirOwnTurn) {
        // end any motion trackers they might have had
        // this is hacky because we would rather have not given them any but
        // it was the easiest way to implement dying on combatant's own turn
        const combatantModel = getGameWorld().modelManager.findOne(targetId);

        for (const [movementType, tracker] of combatantModel.movementManager.getTrackers()) {
          tracker.onComplete();
        }
        battleOption?.turnOrderManager.updateTrackers(game, party);

        combatantModel.movementManager.activeTrackers = {};
      }

      gameState.combatLogMessages.push(
        new CombatLogMessage(
          `${combatant.entityProperties.name}'s hp was reduced to zero`,
          CombatLogMessageStyle.Basic
        )
      );

      if (targetModel.skeletalAnimationManager.playing) {
        if (targetModel.skeletalAnimationManager.playing.options.onComplete)
          targetModel.skeletalAnimationManager.playing.options.onComplete();
      }

      // if (shouldAnimate) // we kind of need to animate this
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

      // checking for isIdling is a simple way to avoid interrupting their return home when
      // they are hit midway through an action, which would cause their turn to never end
      // on the client
      const isIdling = targetModel.isIdling();

      if (shouldAnimate && isIdling)
        targetModel.skeletalAnimationManager.startAnimationWithTransition(animationName, 0, {
          onComplete: () => {
            const wasRevived =
              !combatantWasAliveBeforeResourceChange && combatantProperties.hitPoints > 0;

            if (wasRevived) {
              // - @todo - handle any ressurection by adding the affected combatant's turn tracker back into the battle
            } else {
              targetModel.startIdleAnimation(500);
            }
          },
        });
    }
  });
}
