import {
  CombatActionType,
  AbilityName,
  CombatantProperties,
  ERROR_MESSAGES,
  Inventory,
  PerformCombatActionActionCommandPayload,
  SpeedDungeonGame,
  formatConsumableType,
  ABILITY_NAME_STRINGS,
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
import { induceHitRecovery } from "./induce-hit-recovery";

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
                `${actionUserResult.entityProperties.name} casts ${ABILITY_NAME_STRINGS[combatAction.abilityName]}`,
                CombatLogMessageStyle.Basic
              )
            );
        }
      } else if (combatAction.type === CombatActionType.ConsumableUsed) {
        const itemResult = Inventory.getConsumable(
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
      for (const [targetId, hpChange] of Object.entries(hpChangesByEntityId))
        induceHitRecovery(gameWorld, actionUserId, targetId, hpChange, wasSpell);

    if (mpChangesByEntityId) {
      for (const [targetId, mpChange] of Object.entries(mpChangesByEntityId)) {
        startFloatingMessage(
          targetId,
          [
            {
              type: FloatingMessageElementType.Text,
              text: mpChange,
              classNames: {
                mainText: getTailwindClassFromFloatingTextColor(
                  FloatingMessageTextColor.ManaGained
                ),
                shadowText: "",
              },
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
