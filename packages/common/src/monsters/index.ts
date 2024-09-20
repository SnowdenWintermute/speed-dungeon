import { CombatantProperties } from "../combatants/combatant-properties.js";
import { EntityProperties } from "../primatives/index.js";
import { MonsterType } from "./monster-types.js";
export * from "./monster-types.js";

export class Monster {
  constructor(
    public entityProperties: EntityProperties,
    public combatantProperties: CombatantProperties,
    public monsterType: MonsterType
  ) {}
}
