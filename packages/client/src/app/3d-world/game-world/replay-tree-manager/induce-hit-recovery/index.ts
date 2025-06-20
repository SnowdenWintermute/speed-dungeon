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
  InputLock,
  Battle,
  AdventuringParty,
  FLOATING_MESSAGE_DURATION,
} from "@speed-dungeon/common";
import { getCombatantContext, useGameStore } from "@/stores/game-store";
import { CombatLogMessage, CombatLogMessageStyle } from "@/app/game/combat-log/combat-log-message";
import { useUIStore } from "@/stores/ui-store";
import { postResourceChangeToCombatLog } from "./post-resource-change-to-combat-log";
import { startResourceChangeFloatingMessage } from "./start-resource-change-floating-message";
import { getGameWorld } from "@/app/3d-world/SceneManager";

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

  const action = COMBAT_ACTIONS[actionName];
  const wasSpell = action.origin === CombatActionOrigin.SpellCast;

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

    const battleOption = AdventuringParty.getBattleOption(party, game);

    if (combatantProperties.hitPoints <= 0) {
      const combatantDiedOnTheirOwnTurn = (() => {
        if (battleOption === null) return false;
        return Battle.combatantIsFirstInTurnOrder(battleOption, targetId);
      })();

      const maybeError = SpeedDungeonGame.handleCombatantDeath(game, party.battleId, targetId);
      if (maybeError instanceof Error) return console.error(maybeError);

      if (combatantDiedOnTheirOwnTurn) {
        // if it was the combatant's turn who died and the next active combatant is player controlled, unlock input

        if (!battleOption) InputLock.unlockInput(party.inputLock);
        else {
          const firstInTurnOrder = Battle.getFirstCombatantInTurnOrder(game, battleOption);
          if (firstInTurnOrder instanceof Error) throw firstInTurnOrder;
          if (party.characterPositions.includes(firstInTurnOrder.entityProperties.id))
            InputLock.unlockInput(party.inputLock);
        }

        // end any motion trackers they might have had
        // this is hacky because we would rather have not given them any but
        // it was the easiest way to implement dying on combatant's own turn
        const combatantModel = getGameWorld().modelManager.findOne(targetId);

        for (const [movementType, tracker] of combatantModel.movementManager.getTrackers()) {
          tracker.onComplete();
        }

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
