import {
  CombatActionCombatLogProperties,
  CombatActionComponentConfig,
  CombatActionLeaf,
  CombatActionName,
  CombatActionOrigin,
} from "../../index.js";
import {
  COMBATANT_CLASS_TO_SKILL_BOOK_TYPE,
  Consumable,
  SKILL_BOOK_TYPE_TO_COMBATANT_CLASS,
} from "../../../../items/consumables/index.js";
import { CombatActionCostPropertiesConfig } from "../../combat-action-cost-properties.js";
import { Inventory } from "../../../../combatants/index.js";
import { throwIfError } from "../../../../utils/index.js";
import { BASE_ACTION_HIERARCHY_PROPERTIES } from "../../index.js";
import { ACTION_STEPS_CONFIG_TEMPLATE_GETTERS } from "../generic-action-templates/step-config-templates/index.js";
import {
  createHitOutcomeProperties,
  HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS,
} from "../generic-action-templates/hit-outcome-properties-templates/index.js";
import {
  COST_PROPERTIES_TEMPLATE_GETTERS,
  createCostPropertiesConfig,
} from "../generic-action-templates/cost-properties-templates/index.js";
import { TARGETING_PROPERTIES_TEMPLATE_GETTERS } from "../generic-action-templates/targeting-properties-config-templates/index.js";

const base = HIT_OUTCOME_PROPERTIES_TEMPLATE_GETTERS.BENEVOLENT_CONSUMABLE;
const hitOutcomeProperties = createHitOutcomeProperties(base, {});

const costPropertiesOverrides: Partial<CombatActionCostPropertiesConfig> = {
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
};
const costPropertiesBase = COST_PROPERTIES_TEMPLATE_GETTERS.FAST_ACTION;
const costProperties = createCostPropertiesConfig(costPropertiesBase, costPropertiesOverrides);

const config: CombatActionComponentConfig = {
  description: "Increases the level of the corresponding support class",
  combatLogMessageProperties: new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.Medication,
    getOnUseMessage: (data) => {
      return `${data.nameOfActionUser} reads a skill book.`;
    },
  }),
  targetingProperties: TARGETING_PROPERTIES_TEMPLATE_GETTERS.SELF_ANY_TIME(),
  hitOutcomeProperties,
  costProperties,
  stepsConfig: ACTION_STEPS_CONFIG_TEMPLATE_GETTERS.CONSUMABLE_USE(),
  hierarchyProperties: BASE_ACTION_HIERARCHY_PROPERTIES,
};

export const READ_SKILL_BOOK = new CombatActionLeaf(CombatActionName.ReadSkillBook, config);
