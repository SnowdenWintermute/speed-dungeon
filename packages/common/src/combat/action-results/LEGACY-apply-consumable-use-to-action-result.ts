import { HpChangeSource, HpChangeSourceCategory } from "../index.js";
import {
  Combatant,
  CombatantProperties,
  CombatantTraitType,
  Inventory,
} from "../../combatants/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { randBetween } from "../../utils/index.js";
import { ActionResult } from "./action-result.js";
import { ConsumableType } from "../../items/consumables/index.js";
import { CombatAttribute } from "../../combatants/attributes/index.js";

export default function applyConsumableUseToActionResult(
  game: SpeedDungeonGame,
  actionResult: ActionResult,
  // combatAction: CombatAction,
  targetIds: string[],
  actionUser: Combatant
) {
  //if (combatAction.type !== CombatActionType.ConsumableUsed)
  //  return new Error(
  //    "Tried to calculate consumable use action but was passed a different type of action"
  //  );
  //const { combatantProperties } = actionUser;
  //const itemResult = Inventory.getConsumableById(
  //  combatantProperties.inventory,
  //  combatAction.itemId
  //);
  //if (itemResult instanceof Error) return itemResult;
  //const targetOption = targetIds[0];
  //if (targetOption === undefined)
  //  return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);
  //const targetResult = SpeedDungeonGame.getCombatantById(game, targetOption);
  //if (targetResult instanceof Error) return targetResult;
  //const targetCombatantProperties = targetResult.combatantProperties;
  ////
  //switch (itemResult.consumableType) {
  //  case ConsumableType.HpAutoinjector:
  //    if (targetCombatantProperties.hitPoints === 0)
  //      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.CANT_USE_ON_DEAD_TARGET);
  //    let hpBioavailability = 1;
  //    for (const trait of targetCombatantProperties.traits) {
  //      if (trait.type === CombatantTraitType.HpBioavailability)
  //        hpBioavailability = trait.percent / 100;
  //    }
  //    const maxHp =
  //      CombatantProperties.getTotalAttributes(targetCombatantProperties)[CombatAttribute.Hp];
  //    if (targetCombatantProperties.hitPoints === maxHp)
  //      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.ALREADY_FULL_HP);
  //    const minHealing = (hpBioavailability * maxHp) / 8;
  //    const maxHealing = (hpBioavailability * 3 * maxHp) / 8;
  //    if (!actionResult.hitPointChangesByEntityId) actionResult.hitPointChangesByEntityId = {};
  //    const hpChangeSource = new HpChangeSource(
  //      HpChangeSourceCategory.Medical,
  //      MeleeOrRanged.Ranged
  //    );
  //    hpChangeSource.isHealing = true;
  //    actionResult.hitPointChangesByEntityId[targetOption] = {
  //      value: Math.max(1, randBetween(minHealing, maxHealing)),
  //      source: hpChangeSource,
  //    };
  //    break;
  //  case ConsumableType.MpAutoinjector:
  //    if (targetCombatantProperties.hitPoints === 0)
  //      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.CANT_USE_ON_DEAD_TARGET);
  //    let mpBioavailability = 1;
  //    for (const trait of targetCombatantProperties.traits) {
  //      if (trait.type === CombatantTraitType.MpBioavailability)
  //        mpBioavailability = trait.percent / 100;
  //    }
  //    const maxMp =
  //      CombatantProperties.getTotalAttributes(targetCombatantProperties)[CombatAttribute.Mp];
  //    if (targetCombatantProperties.mana === maxMp)
  //      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.ALREADY_FULL_MP);
  //    const minRestored = (mpBioavailability * maxMp) / 8;
  //    const maxRestored = (mpBioavailability * 3 * maxMp) / 8;
  //    if (!actionResult.manaChangesByEntityId) actionResult.manaChangesByEntityId = {};
  //    actionResult.manaChangesByEntityId[targetOption] = Math.max(
  //      1,
  //      randBetween(minRestored, maxRestored)
  //    );
  //    break;
  //}
  //actionResult.itemIdsConsumed = [combatAction.itemId];
}
