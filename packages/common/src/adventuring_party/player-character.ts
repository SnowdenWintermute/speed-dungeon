import { CombatantClass, CombatantSpecies } from "../combatants";
import { CombatantProperties } from "../combatants/combatant-properties";
import { EntityProperties } from "../primatives/entity-properties";

export class PlayerCharacter {
  entityProperties: EntityProperties;
  combatantProperties: CombatantProperties;
  constructor(
    public nameOfControllingUser: string,
    combatantClass: CombatantClass,
    name: string,
    id: number
  ) {
    this.combatantProperties = new CombatantProperties(
      combatantClass,
      CombatantSpecies.Humanoid,
      {},
      nameOfControllingUser
    );
    this.entityProperties = new EntityProperties(id, name);
  }
}
