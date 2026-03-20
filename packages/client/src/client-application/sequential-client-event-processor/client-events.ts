import { Quaternion, Vector3 } from "@babylonjs/core";
import {
  BattleConclusion,
  CombatantId,
  Consumable,
  EntityId,
  EnvironmentEntityName,
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

export interface ClientEventMap {
  [ClientEventType.SynchronizeCombatantEquipmentModels]: { entityId: CombatantId };
  [ClientEventType.SynchronizeCombatantModels]: {
    softCleanup: boolean;
    placeInHomePositions?: boolean;
    onComplete?: () => void;
  };
  [ClientEventType.SpawnEnvironmentModel]: {
    id: string;
    modelType: EnvironmentEntityName;
    position: Vector3;
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

export type ClientEventHandler<K extends keyof ClientEventMap> = (
  data: ClientEventMap[K]
) => void | Promise<void>;

export type ClientEventHandlers = {
  [K in keyof ClientEventMap]: ClientEventHandler<K>;
};
