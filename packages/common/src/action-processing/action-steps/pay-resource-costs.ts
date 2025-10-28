import {
  ActionResolutionStep,
  ActionResolutionStepContext,
  ActionResolutionStepType,
} from "./index.js";
import { COMBAT_ACTIONS } from "../../combat/index.js";
import { GameUpdateCommandType, ResourcesPaidGameUpdateCommand } from "../game-update-commands.js";
import { MaxAndCurrent } from "../../primatives/max-and-current.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatantProperties } from "../../combatants/combatant-properties.js";

const stepType = ActionResolutionStepType.PayResourceCosts;
export class PayResourceCostsActionResolutionStep extends ActionResolutionStep {
  constructor(context: ActionResolutionStepContext) {
    const { actionUser, game, party } = context.actionUserContext;
    const combatantProperties = actionUser.getCombatantProperties();

    const selectedActionLevelAndRank = actionUser
      .getTargetingProperties()
      .getSelectedActionAndRank();

    // for counterattacks, we'll not have a selected action level but we need one
    // to pass to the resource costs function
    let actionRank = selectedActionLevelAndRank?.rank || 1;

    const action = COMBAT_ACTIONS[context.tracker.actionExecutionIntent.actionName];
    const inCombat = !!AdventuringParty.getBattleOption(party, game);

    const costsOption = action.costProperties.getResourceCosts(actionUser, inCombat, actionRank);

    const consumableTypeAndLevelToConsumeOption = action.costProperties.getConsumableCost
      ? action.costProperties.getConsumableCost(actionUser)
      : undefined;

    const cooldownOption = action.costProperties.getCooldownTurns(actionUser, actionRank);

    let gameUpdateCommandOption: null | ResourcesPaidGameUpdateCommand = null;

    if (
      costsOption !== null ||
      consumableTypeAndLevelToConsumeOption !== undefined ||
      cooldownOption
    ) {
      gameUpdateCommandOption = {
        type: GameUpdateCommandType.ResourcesPaid,
        step: stepType,
        actionName: action.name,
        completionOrderId: null,
        combatantId: actionUser.getEntityId(),
      };

      if (!!consumableTypeAndLevelToConsumeOption) {
        const { inventory } = combatantProperties;
        const consumableOption = inventory.getConsumableByTypeAndLevel(
          consumableTypeAndLevelToConsumeOption.type,
          consumableTypeAndLevelToConsumeOption.level
        );
        if (consumableOption) {
          const removed = inventory.removeConsumable(consumableOption.entityProperties.id);
          if (!(removed instanceof Error)) context.tracker.consumableUsed = removed;
          else console.error(removed);
          gameUpdateCommandOption.itemsConsumed = [consumableOption.entityProperties.id];
        }
      }

      if (costsOption) {
        gameUpdateCommandOption.costsPaid = costsOption;
        CombatantProperties.payResourceCosts(combatantProperties, costsOption);
      }

      const actionState = combatantProperties.abilityProperties.getOwnedActions()[action.name];
      if (actionState !== undefined) {
        actionState.wasUsedThisTurn = true;

        if (cooldownOption) {
          actionState.cooldown = new MaxAndCurrent(cooldownOption, cooldownOption);
          gameUpdateCommandOption.cooldownSet = cooldownOption;
        }
      }
    }

    super(stepType, context, gameUpdateCommandOption);
  }

  protected onTick = () => {};
  getTimeToCompletion = () => 0;
  getBranchingActions = () => [];
}
