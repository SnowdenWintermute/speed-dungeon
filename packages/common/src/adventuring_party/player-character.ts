import {
  CombatantAbility,
  CombatantAbilityName,
  CombatantClass,
  CombatantSpecies,
} from "../combatants";
import { CombatantProperties } from "../combatants/combatant-properties";
import { IdGenerator } from "../game/id_generator";
import { EntityProperties } from "../primatives/entity-properties";
import outfitNewCharacter from "./outfit-new-character";

export class PlayerCharacter {
  entityProperties: EntityProperties;
  combatantProperties: CombatantProperties;
  constructor(
    public nameOfControllingUser: string,
    combatantClass: CombatantClass,
    name: string,
    idGenerator: IdGenerator
  ) {
    this.combatantProperties = new CombatantProperties(
      combatantClass,
      CombatantSpecies.Humanoid,
      {},
      nameOfControllingUser
    );
    this.entityProperties = new EntityProperties(idGenerator.getNextEntityId(), name);

    this.combatantProperties.abilities[CombatantAbilityName.Attack] = CombatantAbility.createByName(
      CombatantAbilityName.Attack
    );
    this.combatantProperties.abilities[CombatantAbilityName.Attack] = CombatantAbility.createByName(
      CombatantAbilityName.AttackMeleeMainhand
    );
    this.combatantProperties.abilities[CombatantAbilityName.Attack] = CombatantAbility.createByName(
      CombatantAbilityName.AttackMeleeOffhand
    );
    this.combatantProperties.abilities[CombatantAbilityName.Attack] = CombatantAbility.createByName(
      CombatantAbilityName.AttackRangedMainhand
    );

    outfitNewCharacter(idGenerator, this);
  }
}
