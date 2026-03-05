import { ActionEntity } from "../action-entities/index.js";
import { EntityId } from "../aliases.js";
import { Combatant } from "../combatants/index.js";
import { SceneEntityChildTransformNodeIdentifier } from "../scene-entities/index.js";
import { SerializedOf } from "../serialization/index.js";

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

export interface SpawnedCombatant {
  type: SpawnableEntityType.Combatant;
  combatant: Combatant;
  parentTransformNodeOption?: SceneEntityChildTransformNodeIdentifier;
  petProperties?: PetProperties;
  doNotIdle?: boolean;
}

export interface SerializedSpawnedCombatant {
  type: SpawnableEntityType.Combatant;
  combatant: SerializedOf<Combatant>;
  parentTransformNodeOption?: SceneEntityChildTransformNodeIdentifier;
  petProperties?: PetProperties;
  doNotIdle?: boolean;
}

export interface SpawnedActionEntity {
  type: SpawnableEntityType.ActionEntity;
  actionEntity: ActionEntity;
}

export interface SerializedSpawnedActionEntity {
  type: SpawnableEntityType.ActionEntity;
  actionEntity: ActionEntity;
}

export type SpawnableEntity = SpawnedCombatant | SpawnedActionEntity;
export type SerializedSpawnableEntity = SerializedSpawnedCombatant | SerializedSpawnedActionEntity;

export function getSpawnableEntityId(entity: SpawnableEntity) {
  switch (entity.type) {
    case SpawnableEntityType.Combatant:
      return entity.combatant.entityProperties.id;
    case SpawnableEntityType.ActionEntity:
      return entity.actionEntity.entityProperties.id;
  }
}
