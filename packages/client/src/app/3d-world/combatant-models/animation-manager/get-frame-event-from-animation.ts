import { AnimationEvent } from "babylonjs";
import {
  CombatActionType,
  CombatantAbilityName,
  CombatantProperties,
  ERROR_MESSAGES,
  PerformCombatActionActionCommandPayload,
  SpeedDungeonGame,
} from "@speed-dungeon/common";
import { GameWorld } from "../../game-world";
import { FloatingTextColor, startFloatingText } from "@/stores/game-store/floating-text";
import { ANIMATION_NAMES } from "./animation-names";
import getCurrentParty from "@/utils/getCurrentParty";
import { CombatLogMessage, CombatLogMessageStyle } from "@/app/game/combat-log/combat-log-message";

export default function getFrameEventFromAnimation(
  gameWorld: GameWorld,
  actionPayload: PerformCombatActionActionCommandPayload,
  actionUserId: string
) {
  const { combatAction, hpChangesByEntityId, mpChangesByEntityId, missesByEntityId } =
    actionPayload;

  let animationEventOption: null | AnimationEvent = null;
  switch (combatAction.type) {
    case CombatActionType.AbilityUsed:
      switch (combatAction.abilityName) {
        case CombatantAbilityName.Attack:
        case CombatantAbilityName.AttackMeleeMainhand:
        // @todo - select correct frames for various attack animations
        case CombatantAbilityName.AttackMeleeOffhand:
        case CombatantAbilityName.AttackRangedMainhand:
        case CombatantAbilityName.Fire:
        case CombatantAbilityName.Ice:
        case CombatantAbilityName.Healing:
          break;
      }
    case CombatActionType.ConsumableUsed:
  }

  animationEventOption = new AnimationEvent(
    20,
    () => {
      if (hpChangesByEntityId)
        for (const [targetId, hpChange] of Object.entries(hpChangesByEntityId)) {
          induceHitRecovery(gameWorld, actionUserId, targetId, hpChange.hpChange, hpChange.isCrit);
        }

      if (mpChangesByEntityId) {
        for (const [targetId, mpChange] of Object.entries(mpChangesByEntityId)) {
          startFloatingText(
            gameWorld.mutateGameState,
            targetId,
            mpChange.toString(),
            FloatingTextColor.ManaGained,
            false,
            2000
          );
          gameWorld.mutateGameState((state) => {
            const gameOption = state.game;
            if (!gameOption) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
            const game = gameOption;
            if (!state.username) return console.error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
            const partyOptionResult = getCurrentParty(state, state.username);
            if (partyOptionResult instanceof Error) return console.error(partyOptionResult);
            if (partyOptionResult === undefined)
              return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);

            const targetResult = SpeedDungeonGame.getCombatantById(game, targetId);
            if (targetResult instanceof Error) return console.error(targetResult);
            CombatantProperties.changeMana(targetResult.combatantProperties, mpChange);

            state.combatLogMessages.push(
              new CombatLogMessage(
                `${targetResult.entityProperties.name} recovered ${mpChange} mana`,
                CombatLogMessageStyle.Basic
              )
            );
          });
        }
      }

      if (missesByEntityId)
        for (const targetId of missesByEntityId) {
          // push evade action
          const targetModel = gameWorld.modelManager.combatantModels[targetId];
          if (targetModel === undefined)
            return console.error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);

          // START THEIR EVADE ANIMATION

          targetModel.animationManager.startAnimationWithTransition(ANIMATION_NAMES.EVADE, 500, {
            shouldLoop: false,
            animationEventOption: null,
            animationDurationOverrideOption: null,
            onComplete: () => {},
          });

          gameWorld.mutateGameState((state) => {
            const gameOption = state.game;
            if (!gameOption) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
            const game = gameOption;
            if (!state.username) return console.error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
            const partyOptionResult = getCurrentParty(state, state.username);
            if (partyOptionResult instanceof Error) return console.error(partyOptionResult);
            if (partyOptionResult === undefined)
              return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);

            const targetResult = SpeedDungeonGame.getCombatantById(game, targetId);
            if (targetResult instanceof Error) return console.error(targetResult);

            state.combatLogMessages.push(
              new CombatLogMessage(
                `${targetResult.entityProperties.name} evaded`,
                CombatLogMessageStyle.Basic
              )
            );
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

  return animationEventOption;
}

function induceHitRecovery(
  gameWorld: GameWorld,
  actionUserId: string,
  targetId: string,
  hpChange: number,
  isCrit: boolean
) {
  const targetModel = gameWorld.modelManager.combatantModels[targetId];
  if (targetModel === undefined) return console.error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);

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
    // - change their hp
    // - determine if died or ressurected
    // - handle any death by removing the affected combatant's turn tracker
    // - handle any ressurection by adding the affected combatant's turn tracker

    const gameOption = gameState.game;
    if (!gameOption) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    const game = gameOption;
    if (!gameState.username) return console.error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
    const partyOptionResult = getCurrentParty(gameState, gameState.username);
    if (partyOptionResult instanceof Error) return console.error(partyOptionResult);
    if (partyOptionResult === undefined)
      return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
    const party = partyOptionResult;
    const combatantResult = SpeedDungeonGame.getCombatantById(game, targetId);
    if (combatantResult instanceof Error) return console.error(combatantResult);
    const { combatantProperties } = combatantResult;

    const combatantWasAliveBeforeHpChange = combatantProperties.hitPoints > 0;
    CombatantProperties.changeHitPoints(combatantProperties, hpChange);

    const actionUserResult = SpeedDungeonGame.getCombatantById(game, actionUserId);
    if (actionUserResult instanceof Error) return console.error(actionUserResult);

    const damagedOrHealed = hpChange > 0 ? "healed" : "hit";
    const hpOrDamage = hpChange > 0 ? "hit points" : "damage";
    const style = hpChange > 0 ? CombatLogMessageStyle.Healing : CombatLogMessageStyle.Basic;

    gameState.combatLogMessages.push(
      new CombatLogMessage(
        `${actionUserResult.entityProperties.name} ${damagedOrHealed} ${combatantResult.entityProperties.name} for ${hpChange} ${hpOrDamage}`,
        style
      )
    );

    if (combatantProperties.hitPoints <= 0) {
      const maybeError = SpeedDungeonGame.handlePlayerDeath(game, party.battleId, targetId);
      if (maybeError instanceof Error) return console.error(maybeError);

      gameState.combatLogMessages.push(
        new CombatLogMessage(
          `${combatantResult.entityProperties.name}'s hp was reduced to zero`,
          CombatLogMessageStyle.Basic
        )
      );

      targetModel.animationManager.startAnimationWithTransition(ANIMATION_NAMES.DEATH, 500, {
        shouldLoop: false,
        animationDurationOverrideOption: null,
        animationEventOption: null,
        onComplete: () => {
          targetModel.animationManager.locked = true;
        },
      });
    }

    if (!combatantWasAliveBeforeHpChange && combatantProperties.hitPoints > 0) {
      // - @todo - handle any ressurection by adding the affected combatant's turn tracker back into the battle
    }
  });
}
