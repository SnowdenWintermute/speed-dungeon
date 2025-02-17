import { Combatant } from "../combatants/index.js";
import { Vfx } from "../vfx/index.js";

export enum SpawnableEntityType {
  Combatant,
  Vfx,
}

export type SpawnedCombatant = {
  type: SpawnableEntityType.Combatant;
  combatant: Combatant;
};

export type SpawnedVfx = {
  type: SpawnableEntityType.Vfx;
  vfx: Vfx;
};

export type SpawnableEntity = SpawnedCombatant | SpawnedVfx;
