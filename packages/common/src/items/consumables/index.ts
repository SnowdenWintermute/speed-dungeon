import { EntityProperties } from "../../primatives/entity-properties.js";
import { Item } from "../index.js";
import { CombatAttribute } from "../../combatants/attributes/index.js";
import { CombatActionName } from "../../combat/index.js";

export enum ConsumableType {
  HpAutoinjector,
  MpAutoinjector,
  StackOfShards,
  WarriorSkillbook,
  RogueSkillbook,
  MageSkillbook,
}

export class Consumable extends Item {
  constructor(
    public entityProperties: EntityProperties,
    public itemLevel: number,
    public requirements: Partial<Record<CombatAttribute, number>>,
    public consumableType: ConsumableType,
    public usesRemaining: number
  ) {
    super(entityProperties, itemLevel, requirements);
  }

  getActionName() {
    return CONSUMABLE_ACTION_NAMES_BY_CONSUMABLE_TYPE[this.consumableType];
  }
}

export const CONSUMABLE_TYPE_STRINGS: Record<ConsumableType, string> = {
  [ConsumableType.HpAutoinjector]: "Green Autoinjector",
  [ConsumableType.MpAutoinjector]: "Blue Autoinjector",
  [ConsumableType.StackOfShards]: "Stack of Shards",
  [ConsumableType.WarriorSkillbook]: "Siege's Guide to Tactics",
  [ConsumableType.RogueSkillbook]: "Nazna's Spreadsheets",
  [ConsumableType.MageSkillbook]: "Arcane Tome",
};

export const CONSUMABLE_ACTION_NAMES_BY_CONSUMABLE_TYPE: Record<
  ConsumableType,
  null | CombatActionName
> = {
  [ConsumableType.HpAutoinjector]: CombatActionName.UseGreenAutoinjector,
  [ConsumableType.MpAutoinjector]: CombatActionName.UseBlueAutoinjector,
  [ConsumableType.StackOfShards]: null,
  [ConsumableType.WarriorSkillbook]: null,
  [ConsumableType.RogueSkillbook]: null,
  [ConsumableType.MageSkillbook]: null,
};

export const SKILL_BOOK_CONSUMABLE_TYPES = [
  ConsumableType.RogueSkillbook,
  ConsumableType.WarriorSkillbook,
  ConsumableType.MageSkillbook,
];
