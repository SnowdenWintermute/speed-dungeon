import { CombatantProperties } from "../combatants/combatant-properties";
import { EntityProperties } from "../primatives";

export class Monster {
  constructor(
    public entityProperties: EntityProperties,
    public combatantProperties: CombatantProperties
  ) {}
}
