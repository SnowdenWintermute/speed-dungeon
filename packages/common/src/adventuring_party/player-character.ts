import { CombatantClass, CombatantSpecies } from "../combatants";
import { CombatantProperties } from "../combatants/combatant-properties";
import { EntityProperties } from "../primatives";

export class PlayerCharacter {
  entityProperties: EntityProperties;
  combatantProperties: CombatantProperties;
  constructor(
    public nameOfControllingUser: string,
    combatantClass: CombatantClass,
    name: string,
    id: number
  ) {
    this.entityProperties = new EntityProperties(id, name);
    this.combatantProperties = new CombatantProperties(
      combatantClass,
      CombatantSpecies.Humanoid,
      {},
      nameOfControllingUser
    );
  }
}
