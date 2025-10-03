import { ActionEntity } from "../action-entities/index.js";
import { Combatant } from "../combatants/index.js";
import { EntityId } from "../primatives/index.js";

export enum SpawnableEntityType {
  Combatant,
  ActionEntity,
}

export const SPAWNABLE_ENTITY_TYPE_STRINGS: Record<SpawnableEntityType, string> = {
  [SpawnableEntityType.Combatant]: "Combatant",
  [SpawnableEntityType.ActionEntity]: "Action Entity",
};

export interface PetProperties {
  ownerId: EntityId;
}

export type SpawnedCombatant = {
  type: SpawnableEntityType.Combatant;
  combatant: Combatant;
  petProperties: PetProperties;
};

export type SpawnedActionEntity = {
  type: SpawnableEntityType.ActionEntity;
  actionEntity: ActionEntity;
};

export type SpawnableEntity = SpawnedCombatant | SpawnedActionEntity;

export function getSpawnableEntityId(entity: SpawnableEntity) {
  switch (entity.type) {
    case SpawnableEntityType.Combatant:
      return entity.combatant.entityProperties.id;
    case SpawnableEntityType.ActionEntity:
      return entity.actionEntity.entityProperties.id;
  }
}
