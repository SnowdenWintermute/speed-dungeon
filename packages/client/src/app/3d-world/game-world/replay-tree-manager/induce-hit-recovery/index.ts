import {
  SkeletalAnimationName,
  ERROR_MESSAGES,
  ResourceChange,
  ActionPayableResource,
  CombatActionName,
  COMBAT_ACTIONS,
  ActionResolutionStepType,
} from "@speed-dungeon/common";
import { getGameWorld } from "@/app/3d-world/SceneManager";
import { characterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import { AppStore } from "@/mobx-stores/app-store";
import { DialogElementName } from "@/mobx-stores/dialogs";
import { FloatingMessageService } from "@/mobx-stores/game-event-notifications/floating-message-service";
import { GameLogMessageService } from "@/mobx-stores/game-event-notifications/game-log-message-service";

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

  FloatingMessageService.startResourceChangeFloatingMessage(
    targetId,
    resourceChange,
    resourceType,
    wasBlocked
  );

  const showDebug = AppStore.get().dialogStore.isOpen(DialogElementName.Debug);

  const combatantContext = AppStore.get().gameStore.getExpectedCombatantContext(targetId);
  const { game, party, combatant: targetCombatant } = combatantContext;
  const combatantProperties = targetCombatant.getCombatantProperties();

  const combatantWasAliveBeforeResourceChange = !combatantProperties.isDead();
  if (resourceType === ActionPayableResource.HitPoints)
    combatantProperties.resources.changeHitPoints(resourceChange.value);
  if (resourceType === ActionPayableResource.Mana)
    combatantProperties.resources.changeMana(resourceChange.value);

  const action = COMBAT_ACTIONS[actionName];
  GameLogMessageService.postResourceChange(
    resourceChange,
    resourceType,
    action,
    wasBlocked,
    targetCombatant,
    actionUserName,
    actionUserId === targetCombatant.getEntityId(),
    showDebug
  );

  const battleOption = party.getBattleOption(game);

  if (combatantProperties.isDead()) {
    targetModel.cosmeticEffectManager.softCleanup(() => {});

    const combatantDiedOnTheirOwnTurn = (() => {
      if (battleOption === null) return false;
      return battleOption.turnOrderManager.combatantIsFirstInTurnOrder(targetId);
    })();

    battleOption?.turnOrderManager.updateTrackers(game, party);

    // end any motion trackers they might have had
    // this is hacky because we would rather have not given them any but
    // it was the easiest way to implement dying on combatant's own turn
    const combatantModel = getGameWorld().modelManager.findOne(targetId);

    for (const [movementType, tracker] of combatantModel.movementManager.getTrackers()) {
      tracker.onComplete();
    }
    combatantModel.movementManager.activeTrackers = {};

    if (combatantDiedOnTheirOwnTurn) {
      battleOption?.turnOrderManager.updateTrackers(game, party);
    }

    const newlyActiveTracker = battleOption?.turnOrderManager.getFastestActorTurnOrderTracker();
    if (newlyActiveTracker !== undefined)
      characterAutoFocusManager.updateFocusedCharacterOnNewTurnOrder(newlyActiveTracker);

    GameLogMessageService.postCombatantDeath(targetCombatant.getName());

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
            !combatantWasAliveBeforeResourceChange && !combatantProperties.isDead();

          if (wasRevived) {
            // - @todo - handle any ressurection by adding the affected combatant's turn tracker back into the battle
          } else {
            targetModel.startIdleAnimation(500);
          }
        },
      });
  }
}
