import {
  CombatActionType,
  AbilityName,
  CombatantProperties,
  ERROR_MESSAGES,
  Inventory,
  PerformCombatActionActionCommandPayload,
  SpeedDungeonGame,
  formatAbilityName,
  formatConsumableType,
} from "@speed-dungeon/common";
import { GameWorld } from "../../game-world";
import {
  FloatingMessageElementType,
  FloatingMessageTextColor,
  getTailwindClassFromFloatingTextColor,
  startFloatingMessage,
} from "@/stores/game-store/floating-messages";
import { ANIMATION_NAMES } from "./animation-names";
import getCurrentParty from "@/utils/getCurrentParty";
import { CombatLogMessage, CombatLogMessageStyle } from "@/app/game/combat-log/combat-log-message";
import { useGameStore } from "@/stores/game-store";
import { HpChange } from "@speed-dungeon/common/src/combat/action-results/hp-change-result-calculation";
import startHpChangeFloatingMessage from "./start-hp-change-floating-message";

export default function getFrameEventFromAnimation(
  gameWorld: GameWorld,
  actionPayload: PerformCombatActionActionCommandPayload,
  actionUserId: string
): { fn: () => void; frame: number } {
  const { combatAction, hpChangesByEntityId, mpChangesByEntityId, missesByEntityId } =
    actionPayload;

  let animationEventOption: null | (() => void) = null;

  switch (combatAction.type) {
    case CombatActionType.AbilityUsed:
      switch (combatAction.abilityName) {
        case AbilityName.Attack:
        case AbilityName.AttackMeleeMainhand:
        // @todo - select correct frames for various attack animations
        case AbilityName.AttackMeleeOffhand:
        case AbilityName.AttackRangedMainhand:
        case AbilityName.Fire:
        case AbilityName.Ice:
        case AbilityName.Healing:
          break;
      }
    case CombatActionType.ConsumableUsed:
  }

  animationEventOption = () => {
    let wasSpell = false;
    useGameStore.getState().mutateState((state) => {
      const gameOption = state.game;
      if (!gameOption) return console.error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
      const game = gameOption;
      const actionUserResult = SpeedDungeonGame.getCombatantById(game, actionUserId);
      if (actionUserResult instanceof Error) return console.error(actionUserResult);
      if (combatAction.type === CombatActionType.AbilityUsed) {
        switch (combatAction.abilityName) {
          case AbilityName.Attack:
          case AbilityName.AttackMeleeMainhand:
          case AbilityName.AttackMeleeOffhand:
          case AbilityName.AttackRangedMainhand:
            break;
          case AbilityName.Fire:
          case AbilityName.Ice:
          case AbilityName.Healing:
            wasSpell = true;
            state.combatLogMessages.push(
              new CombatLogMessage(
                `${actionUserResult.entityProperties.name} casts ${formatAbilityName(combatAction.abilityName)}`,
                CombatLogMessageStyle.Basic
              )
            );
        }
      } else if (combatAction.type === CombatActionType.ConsumableUsed) {
        const itemResult = Inventory.getConsumableProperties(
          actionUserResult.combatantProperties.inventory,
          combatAction.itemId
        );
        if (itemResult instanceof Error) return console.error(itemResult);
        new CombatLogMessage(
          `${actionUserResult.entityProperties.name} uses ${formatConsumableType(itemResult.consumableType)}`,
          CombatLogMessageStyle.Basic
        );
      }
    });

    if (hpChangesByEntityId)
      for (const [targetId, hpChange] of Object.entries(hpChangesByEntityId)) {
        induceHitRecovery(gameWorld, actionUserId, targetId, hpChange, wasSpell);
      }

    if (mpChangesByEntityId) {
      for (const [targetId, mpChange] of Object.entries(mpChangesByEntityId)) {
        startFloatingMessage(
          targetId,
          [
            {
              type: FloatingMessageElementType.Text,
              text: mpChange,
              classNames: getTailwindClassFromFloatingTextColor(
                FloatingMessageTextColor.ManaGained
              ),
            },
          ],
          2000
        );

        useGameStore.getState().mutateState((state) => {
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

        useGameStore.getState().mutateState((state) => {
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

        startFloatingMessage(
          targetId,
          [{ type: FloatingMessageElementType.Text, text: "Evaded", classNames: "text-gray-500" }],
          2000
        );
      }
  };

  return { fn: animationEventOption, frame: 22 };
}

function induceHitRecovery(
  gameWorld: GameWorld,
  actionUserId: string,
  targetId: string,
  hpChange: HpChange,
  wasSpell: boolean
) {
  const targetModel = gameWorld.modelManager.combatantModels[targetId];
  if (targetModel === undefined) return console.error(ERROR_MESSAGES.GAME_WORLD.NO_COMBATANT_MODEL);

  startHpChangeFloatingMessage(targetId, hpChange, 2000);

  useGameStore.getState().mutateState((gameState) => {
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
    CombatantProperties.changeHitPoints(combatantProperties, hpChange.value);

    const actionUserResult = SpeedDungeonGame.getCombatantById(game, actionUserId);
    if (actionUserResult instanceof Error) return console.error(actionUserResult);

    const hpOrDamage = hpChange.value > 0 ? "hit points" : "damage";

    if (wasSpell) {
      const damagedOrHealed = hpChange.value > 0 ? "recovers" : "takes";
      const style =
        hpChange.value > 0 ? CombatLogMessageStyle.Healing : CombatLogMessageStyle.Basic;

      gameState.combatLogMessages.push(
        new CombatLogMessage(
          `${combatantResult.entityProperties.name} ${damagedOrHealed} ${Math.abs(hpChange.value)} ${hpOrDamage}`,
          style
        )
      );
    } else {
      const damagedOrHealed = hpChange.value > 0 ? "healed" : "hit";
      const style =
        hpChange.value > 0 ? CombatLogMessageStyle.Healing : CombatLogMessageStyle.Basic;

      const isTargetingSelf =
        actionUserResult.entityProperties.id === combatantResult.entityProperties.id;
      const targetNameText = isTargetingSelf ? "themselves" : combatantResult.entityProperties.name;

      gameState.combatLogMessages.push(
        new CombatLogMessage(
          `${actionUserResult.entityProperties.name} ${damagedOrHealed} ${targetNameText} for ${Math.abs(hpChange.value)} ${hpOrDamage}`,
          style
        )
      );
    }

    if (combatantProperties.hitPoints <= 0) {
      const maybeError = SpeedDungeonGame.handlePlayerDeath(game, party.battleId, targetId);
      if (maybeError instanceof Error) return console.error(maybeError);

      gameState.combatLogMessages.push(
        new CombatLogMessage(
          `${combatantResult.entityProperties.name}'s hp was reduced to zero`,
          CombatLogMessageStyle.Basic
        )
      );

      targetModel.animationManager.startAnimationWithTransition(ANIMATION_NAMES.DEATH, 0, {
        shouldLoop: false,
        animationDurationOverrideOption: null,
        animationEventOption: null,
        onComplete: () => {
          targetModel.animationManager.locked = true;
        },
      });
    }

    if (!combatantWasAliveBeforeHpChange && combatantProperties.hitPoints > 0) {
      targetModel.animationManager.startAnimationWithTransition(ANIMATION_NAMES.IDLE, 500);
      // - @todo - handle any ressurection by adding the affected combatant's turn tracker back into the battle
    }
  });
}
