import { CombatAction, CombatActionType } from "..";
import {
  CombatAttribute,
  CombatantDetails,
  CombatantProperties,
  CombatantTraitType,
  Inventory,
} from "../../combatants";
import { ERROR_MESSAGES } from "../../errors";
import { SpeedDungeonGame } from "../../game";
import { ConsumableType, ItemPropertiesType } from "../../items";
import { randBetween } from "../../utils";
import { ActionResult } from "./action-result";

export default function applyConsumableUseToActionResult(
  game: SpeedDungeonGame,
  actionResult: ActionResult,
  combatAction: CombatAction,
  targetIds: string[],
  actionUser: CombatantDetails
) {
  if (combatAction.type !== CombatActionType.ConsumableUsed)
    return new Error(
      "Tried to calculate consumable use action but was passed a different type of action"
    );
  const { combatantProperties } = actionUser;
  const itemResult = Inventory.getItem(combatantProperties.inventory, combatAction.itemId);
  if (itemResult instanceof Error) return itemResult;

  switch (itemResult.itemProperties.type) {
    case ItemPropertiesType.Equipment:
      return new Error(ERROR_MESSAGES.ITEM.INVALID_TYPE);
    case ItemPropertiesType.Consumable:
      const targetOption = targetIds[0];
      if (targetOption === undefined)
        return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.NO_TARGET_PROVIDED);
      const targetResult = SpeedDungeonGame.getCombatantById(game, targetOption);
      if (targetResult instanceof Error) return targetResult;
      const targetCombatantProperties = targetResult.combatantProperties;
      //
      switch (itemResult.itemProperties.consumableProperties.consumableType) {
        case ConsumableType.HpAutoinjector:
          // handle hp autoinjector
          if (targetCombatantProperties.hitPoints === 0)
            return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.CANT_USE_ON_DEAD_TARGET);
          let hpBioavailability = 1;
          for (const trait of targetCombatantProperties.traits) {
            if (trait.type === CombatantTraitType.HpBioavailability)
              hpBioavailability = trait.percent / 100;
          }
          const maxHp =
            CombatantProperties.getTotalAttributes(targetCombatantProperties)[CombatAttribute.Hp];
          if (targetCombatantProperties.hitPoints === maxHp)
            return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.ALREADY_FULL_HP);
          const minHealing = (hpBioavailability * maxHp) / 8;
          const maxHealing = (hpBioavailability * 3 * maxHp) / 8;
          if (!actionResult.hitPointChangesByEntityId) actionResult.hitPointChangesByEntityId = {};
          actionResult.hitPointChangesByEntityId[targetOption] = randBetween(
            minHealing,
            maxHealing
          );

          break;
        case ConsumableType.MpAutoinjector:
          // handle mp autoinjector
          if (targetCombatantProperties.hitPoints === 0)
            return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.CANT_USE_ON_DEAD_TARGET);
          let mpBioavailability = 1;
          for (const trait of targetCombatantProperties.traits) {
            if (trait.type === CombatantTraitType.MpBioavailability)
              mpBioavailability = trait.percent / 100;
          }
          const maxMp =
            CombatantProperties.getTotalAttributes(targetCombatantProperties)[CombatAttribute.Mp];
          if (targetCombatantProperties.mana === maxMp)
            return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.ALREADY_FULL_MP);
          const minRestored = (mpBioavailability * maxMp) / 8;
          const maxRestored = (mpBioavailability * 3 * maxMp) / 8;

          if (!actionResult.manaChangesByEntityId) actionResult.manaChangesByEntityId = {};
          actionResult.manaChangesByEntityId[targetOption] = randBetween(minRestored, maxRestored);
          break;
      }
  }

  actionResult.itemIdsConsumed = [combatAction.itemId];
}
