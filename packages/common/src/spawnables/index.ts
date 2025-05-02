import { ActionEntity } from "../action-entities/index.js";
import { Combatant } from "../combatants/index.js";

export enum SpawnableEntityType {
  Combatant,
  ActionEntity,
}

export const SPAWNABLE_ENTITY_TYPE_STRINGS: Record<SpawnableEntityType, string> = {
  [SpawnableEntityType.Combatant]: "Combatant",
  [SpawnableEntityType.ActionEntity]: "Action Entity",
};

export type SpawnedCombatant = {
  type: SpawnableEntityType.Combatant;
  combatant: Combatant;
};

export type SpawnedActionEntity = {
  type: SpawnableEntityType.ActionEntity;
  actionEntity: ActionEntity;
};

export type SpawnableEntity = SpawnedCombatant | SpawnedActionEntity;
