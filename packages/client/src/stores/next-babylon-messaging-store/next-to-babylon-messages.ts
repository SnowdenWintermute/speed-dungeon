import { CombatantClass, CombatantSpecies } from "@speed-dungeon/common";
import { Vector3 } from "babylonjs";

export enum NextToBabylonMessageTypes {
  SpawnCombatantModel,
  RemoveCombatantModel,
}

type SpawnCombatantModelMessage = {
  type: NextToBabylonMessageTypes.SpawnCombatantModel;
  combatant: {
    entityId: string;
    species: CombatantSpecies;
    class: CombatantClass;
    startPosition: Vector3;
    startRotation: number;
  };
};

type RemoveCombatantModelMessage = {
  type: NextToBabylonMessageTypes.RemoveCombatantModel;
  entityId: string;
};

export type NextToBabylonMessage = SpawnCombatantModelMessage | RemoveCombatantModelMessage;
