import { EntityId, EntityName, GameId, IdentityProviderId } from "../../../aliases.js";
import { APP_VERSION_NUMBER } from "../../../app-consts.js";
import { CombatantProperties } from "../../../combatants/combatant-properties.js";
import { Combatant } from "../../../combatants/index.js";
import { CharacterControlScheme } from "../../../game-modes/index.js";
import { SerializedOf } from "../../../serialization/index.js";

export class SerializedPlayerCharacter {
  id: EntityId;
  name: EntityName;
  ownerId: IdentityProviderId;
  controlScheme: CharacterControlScheme;
  displayOrder: number | null = null;
  ironmanRunGameId?: GameId;
  gameVersion: string = APP_VERSION_NUMBER;
  combatantProperties: SerializedOf<CombatantProperties>;
  pets: SerializedOf<Combatant>[];
  createdAt: number | Date = Date.now();
  updatedAt: number | Date = Date.now();

  constructor(
    combatant: Combatant,
    pets: Combatant[],
    ownerId: IdentityProviderId,
    controlScheme: CharacterControlScheme
  ) {
    const { id, name } = combatant.entityProperties;
    const { combatantProperties } = combatant.toSerialized();
    const serializedPets = pets.map((pet) => pet.toSerialized());
    this.id = id;
    this.name = name;
    this.ownerId = ownerId;
    this.controlScheme = controlScheme;
    this.combatantProperties = combatantProperties;
    this.pets = serializedPets;
  }
}
