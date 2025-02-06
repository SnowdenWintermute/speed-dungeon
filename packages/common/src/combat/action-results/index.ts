export * from "./turn-result.js";
export * from "./action-result.js";
export * from "./get-action-results.js";
export * from "./action-result-calculator.js";
export * from "./hp-change-evasion-and-durability-change-result-calculation/index.js";

import cloneDeep from "lodash.clonedeep/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { ActionResult } from "./action-result.js";
import { CombatantProperties } from "../../combatants/index.js";
import { ActionResultCalculationArguments } from "./action-result-calculator.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { calculateActionHitPointChangesEvasionsAndDurabilityChanges } from "./hp-change-evasion-and-durability-change-result-calculation/index.js";
import { ActionPayableResource } from "../combat-actions/action-calculation-utils/action-costs.js";

export default function calculateActionResult(
  game: SpeedDungeonGame,
  args: ActionResultCalculationArguments
): Error | ActionResult {
  throw new Error("legacy method to be deleted");
  // const { userId, combatAction, targets } = args;
  // const actionResult = new ActionResult(userId, combatAction.name, cloneDeep(targets));
  // const combatantResult = SpeedDungeonGame.getCombatantById(game, userId);
  // if (combatantResult instanceof Error) return combatantResult;
  // const { combatantProperties } = combatantResult;
  // const actionPropertiesResult = CombatantProperties.getCombatActionPropertiesIfOwned(
  //   combatantProperties,
  //   combatAction.name
  // );
  // if (actionPropertiesResult instanceof Error) return actionPropertiesResult;
  // const combatActionProperties = actionPropertiesResult;
  // actionResult.endsTurn = combatActionProperties.requiresCombatTurn(combatantProperties);
  // const partyResult = SpeedDungeonGame.getPartyOfCombatant(game, userId);
  // if (partyResult instanceof Error) return partyResult;
  // const targetIdsResult = getCombatActionTargetIds(
  //   partyResult,
  //   combatActionProperties,
  //   userId,
  //   args.allyIds,
  //   args.battleOption,
  //   targets
  // );
  // if (targetIdsResult instanceof Error) return targetIdsResult;
  // const targetIds = targetIdsResult;
  // actionResult.targetIds = targetIds;
  // // @TODO - get other resource costs besides mp
  // const costsOption = combatAction.getResourceCosts(combatantProperties);
  // if (costsOption && costsOption[ActionPayableResource.Mana] !== undefined)
  //   actionResult.manaCost = Math.floor(costsOption[ActionPayableResource.Mana]);
  // if (combatantProperties.mana < actionResult.manaCost)
  //   return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INSUFFICIENT_MANA);
  // // CONSUMABLE ONLY
  // // if (combatAction.type === CombatActionType.ConsumableUsed) {
  // //   const maybeError = applyConsumableUseToActionResult(
  // //     game,
  // //     actionResult,
  // //     combatAction,
  // //     targetIds,
  // //     combatantResult
  // //   );
  // //   if (maybeError instanceof Error) console.error(maybeError);
  // //   if (maybeError instanceof Error) return maybeError;
  // // }
  // // END CONSUMABLE
  // const hitPointChangesCritsEvasionsAndDurabilityChangesResult =
  //   calculateActionHitPointChangesEvasionsAndDurabilityChanges(
  //     game,
  //     args,
  //     targetIds,
  //     combatActionProperties
  //   );
  // if (hitPointChangesCritsEvasionsAndDurabilityChangesResult instanceof Error)
  //   return hitPointChangesCritsEvasionsAndDurabilityChangesResult;
  // const { hitPointChanges, evasions, durabilityChanges } =
  //   hitPointChangesCritsEvasionsAndDurabilityChangesResult;
  // if (Object.keys(hitPointChanges).length) actionResult.hitPointChangesByEntityId = hitPointChanges;
  // if (Object.keys(evasions).length) actionResult.missesByEntityId = evasions;
  // if (Object.keys(durabilityChanges).length) actionResult.durabilityChanges = durabilityChanges;
  // return actionResult;
}
