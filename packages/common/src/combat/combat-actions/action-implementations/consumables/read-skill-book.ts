import {
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
  TargetCategories,
} from "../../index.js";
import {
  COMBATANT_CLASS_TO_SKILL_BOOK_TYPE,
  Consumable,
  SKILL_BOOK_TYPE_TO_COMBATANT_CLASS,
} from "../../../../items/consumables/index.js";
import {
  CombatActionTargetingPropertiesConfig,
  GENERIC_TARGETING_PROPERTIES,
  TargetingPropertiesTypes,
} from "../../combat-action-targeting-properties.js";
import {
  ActionHitOutcomePropertiesBaseTypes,
  CombatActionHitOutcomeProperties,
  GENERIC_HIT_OUTCOME_PROPERTIES,
} from "../../combat-action-hit-outcome-properties.js";
import {
  ActionCostPropertiesBaseTypes,
  BASE_ACTION_COST_PROPERTIES,
} from "../../combat-action-cost-properties.js";
import { MEDICATION_ACTION_BASE_STEPS_CONFIG } from "./base-consumable-steps-config.js";
import { CombatantProperties, Inventory } from "../../../../combatants/index.js";
import { throwIfError } from "../../../../utils/index.js";

const targetingProperties: CombatActionTargetingPropertiesConfig = {
  ...GENERIC_TARGETING_PROPERTIES[TargetingPropertiesTypes.FriendlySingle],
  getValidTargetCategories: () => TargetCategories.User,
};

const hitOutcomeProperties: CombatActionHitOutcomeProperties = {
  ...GENERIC_HIT_OUTCOME_PROPERTIES[ActionHitOutcomePropertiesBaseTypes.Medication],
};

const config: CombatActionComponentConfig = {
  description: "Increases the level of the corresponding support class",
  origin: CombatActionOrigin.Medication,
  getOnUseMessage: (data) => {
    return `${data.nameOfActionUser} reads a skill book.`;
  },
  targetingProperties,
  hitOutcomeProperties,
  costProperties: {
    ...BASE_ACTION_COST_PROPERTIES[ActionCostPropertiesBaseTypes.Medication],
    getConsumableCost: (user) => {
      const itemId = user.selectedItemId;
      if (itemId === null) throw new Error("expected to have a book selected");
      const selectedItem = throwIfError(Inventory.getItemById(user.inventory, itemId));
      if (!(selectedItem instanceof Consumable)) throw new Error("expected to select a consumable");
      return { type: selectedItem.consumableType, level: selectedItem.itemLevel };
    },
    getMeetsCustomRequirements: (user, actionLevel) => {
      // check what book they are selecting
      // if it isn't a skill book, error
      const skillBookResult = Inventory.getSelectedSkillBook(user.inventory, user.selectedItemId);
      if (skillBookResult instanceof Error)
        return { meetsRequirements: false, reasonDoesNot: skillBookResult.message };

      // if they have no support class it is allowed
      const { supportClassProperties } = user;
      if (supportClassProperties !== null) {
        const { combatantClass } = supportClassProperties;
        // if they already have a support class that isn't matching, return error
        const requiredSkillBookType = COMBATANT_CLASS_TO_SKILL_BOOK_TYPE[combatantClass];
        if (skillBookResult.consumableType !== requiredSkillBookType)
          return {
            meetsRequirements: false,
            reasonDoesNot: "You can only read a skill book that is relevant to your support class",
          };
      }

      // don't let them get a support class same as their main class
      const skillBookClass = SKILL_BOOK_TYPE_TO_COMBATANT_CLASS[skillBookResult.consumableType];
      if (skillBookClass === undefined)
        return {
          meetsRequirements: false,
          reasonDoesNot: "Somehow tried to read a skill book that wasn't associated with any class",
        };
      if (user.combatantClass === skillBookClass)
        return {
          meetsRequirements: false,
          reasonDoesNot: "You could have written this book - reading it won't help you",
        };

      const supportClassLevel = supportClassProperties?.level || 0;
      // check required level of book
      const requiredMinimumSkillBookLevel = supportClassLevel + 1;
      if (skillBookResult.itemLevel < requiredMinimumSkillBookLevel)
        return {
          meetsRequirements: false,
          reasonDoesNot: "You are already familiar with the concepts described in this book",
        };

      // don't allow reading a book if their support class is already half the level of their main class
      const mainClassLevel = user.level;
      const supportClassAtMaxLevel = supportClassLevel >= Math.floor(mainClassLevel / 2);
      if (supportClassAtMaxLevel)
        return {
          meetsRequirements: false,
          reasonDoesNot: "Support class level can be a maximum of one half your main class level",
        };

      return { meetsRequirements: true };
    },
  },

  stepsConfig: MEDICATION_ACTION_BASE_STEPS_CONFIG,

  shouldExecute: () => true,
  getChildren: () => [],
  getParent: () => null,
};

export const READ_SKILL_BOOK = new CombatActionLeaf(CombatActionName.ReadSkillBook, config);

export function onSkillBookRead(user: CombatantProperties, book: Consumable) {
  const skillBookClass = SKILL_BOOK_TYPE_TO_COMBATANT_CLASS[book.consumableType];
  if (skillBookClass === undefined)
    return new Error("Somehow tried to read a skill book that wasn't associated with any class");

  CombatantProperties.changeSupportClassLevel(user, skillBookClass, 1);
  return { supportClassLevelIncreased: skillBookClass };
}
