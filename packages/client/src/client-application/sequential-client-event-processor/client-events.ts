import { EnvironmentModelTypes } from "@/game-world-view/scene-entities/environment-models/environment-model-paths";
import { Quaternion, Vector3 } from "@babylonjs/core";
import {
  BattleConclusion,
  CombatantId,
  Consumable,
  EntityId,
  Equipment,
  GameMessage,
  NestedNodeReplayEvent,
  PartyName,
  Username,
} from "@speed-dungeon/common";

export enum ClientEventType {
  ClearAllModels,
  SynchronizeCombatantEquipmentModels,
  SynchronizeCombatantModels,
  SpawnEnvironmentModel,
  DespawnEnvironmentModel,
  ProcessReplayTree,
  ProcessBattleResult,
  PostGameMessages,
  RemovePlayerFromGame,
}

export const CLIENT_EVENT_TYPE_STRINGS: Record<ClientEventType, string> = {
  [ClientEventType.SynchronizeCombatantEquipmentModels]: "Synchronize Combatant Equipment Models",
  [ClientEventType.SynchronizeCombatantModels]: "Synchronize Combatant Models",
  [ClientEventType.SpawnEnvironmentModel]: "Spawn Environment Model",
  [ClientEventType.DespawnEnvironmentModel]: "Despawn Environment Model",
  [ClientEventType.ClearAllModels]: "Clear All Models",
  [ClientEventType.ProcessReplayTree]: "Process Replay Tree",
  [ClientEventType.ProcessBattleResult]: "Process Battle Result",
  [ClientEventType.PostGameMessages]: "Post Game Messages",
  [ClientEventType.RemovePlayerFromGame]: "Remove Player From Game",
};

export type LadderDeathsUpdate = Record<
  EntityName,
  { owner: Username; rank: number; level: number }
>;

export interface ClientEventMap {
  [ClientEventType.SynchronizeCombatantEquipmentModels]: { entityId: string };
  [ClientEventType.SynchronizeCombatantModels]: { placeInHomePositions: boolean };
  [ClientEventType.SpawnEnvironmentModel]: {
    id: string;
    path: string;
    position: Vector3;
    modelType: EnvironmentModelTypes;
    rotationQuat?: Quaternion;
  };
  [ClientEventType.DespawnEnvironmentModel]: { id: string };
  [ClientEventType.ClearAllModels]: undefined;
  [ClientEventType.ProcessReplayTree]: {
    actionUserId: EntityId;
    root: NestedNodeReplayEvent;
    doNotLockInput?: boolean;
  };
  [ClientEventType.ProcessBattleResult]: {
    conclusion: BattleConclusion;
    partyName: PartyName;
    experiencePointChanges: Record<CombatantId, number>;
    timestamp: number;
    actionEntitiesRemoved: EntityId[];
    loot?: undefined | { equipment: Equipment[]; consumables: Consumable[] };
  };
  [ClientEventType.PostGameMessages]: {
    messages: GameMessage[];
    partyChannelToExclude?: string;
  };
  [ClientEventType.RemovePlayerFromGame]: {
    username: Username;
  };
}

export type ClientEvent = {
  [K in keyof ClientEventMap]: {
    type: K;
    data: ClientEventMap[K];
  };
}[keyof ClientEventMap];
