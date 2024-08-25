import { CombatantProperties } from "../combatants/combatant-properties";
import { EntityProperties } from "../primatives";
import { MonsterType } from "./monster-types";
export * from "./monster-types";

export class Monster {
  constructor(
    public entityProperties: EntityProperties,
    public combatantProperties: CombatantProperties,
    public monsterType: MonsterType
  ) {}
}
