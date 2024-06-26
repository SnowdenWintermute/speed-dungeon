import { EntityProperties } from "../primatives/entity-properties";
import {
  CombatantAbility,
  CombatantAbilityName,
  CombatantClass,
  CombatantSpecies,
} from "../combatants";
import { CombatantProperties } from "../combatants/combatant-properties";

export class PlayerCharacter {
  entityProperties: EntityProperties;
  combatantProperties: CombatantProperties;
  constructor(
    public nameOfControllingUser: string,
    combatantClass: CombatantClass,
    name: string,
    id: string
  ) {
    this.combatantProperties = new CombatantProperties(
      combatantClass,
      CombatantSpecies.Humanoid,
      {},
      nameOfControllingUser
    );
    this.entityProperties = { id, name };

    this.combatantProperties.abilities[CombatantAbilityName.Attack] = CombatantAbility.createByName(
      CombatantAbilityName.Attack
    );
    this.combatantProperties.abilities[CombatantAbilityName.AttackMeleeMainhand] =
      CombatantAbility.createByName(CombatantAbilityName.AttackMeleeMainhand);
    this.combatantProperties.abilities[CombatantAbilityName.AttackMeleeOffhand] =
      CombatantAbility.createByName(CombatantAbilityName.AttackMeleeOffhand);
    this.combatantProperties.abilities[CombatantAbilityName.AttackRangedMainhand] =
      CombatantAbility.createByName(CombatantAbilityName.AttackRangedMainhand);
  }
}
