import { Quaternion, Vector3 } from "@babylonjs/core";
import { CombatantId, EntityId, PartyName, Username } from "../aliases";
import { EnvironmentEntityName } from "../environment-entities";
import { NestedNodeReplayEvent } from "../action-processing/replay-events";
import { BattleConclusion } from "../battle";
import { Equipment } from "../items/equipment";
import { Consumable } from "../items/consumables";
import { GameMessage } from "./game-message";

export enum ClientSequentialEventType {
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

export const CLIENT_EVENT_TYPE_STRINGS: Record<ClientSequentialEventType, string> = {
  [ClientSequentialEventType.SynchronizeCombatantEquipmentModels]:
    "Synchronize Combatant Equipment Models",
  [ClientSequentialEventType.SynchronizeCombatantModels]: "Synchronize Combatant Models",
  [ClientSequentialEventType.SpawnEnvironmentModel]: "Spawn Environment Model",
  [ClientSequentialEventType.DespawnEnvironmentModel]: "Despawn Environment Model",
  [ClientSequentialEventType.ClearAllModels]: "Clear All Models",
  [ClientSequentialEventType.ProcessReplayTree]: "Process Replay Tree",
  [ClientSequentialEventType.ProcessBattleResult]: "Process Battle Result",
  [ClientSequentialEventType.PostGameMessages]: "Post Game Messages",
  [ClientSequentialEventType.RemovePlayerFromGame]: "Remove Player From Game",
};

export interface ClientSequentialEventMap {
  [ClientSequentialEventType.SynchronizeCombatantEquipmentModels]: { entityId: CombatantId };
  [ClientSequentialEventType.SynchronizeCombatantModels]: {
    softCleanup: boolean;
    placeInHomePositions?: boolean;
    onComplete?: () => void;
  };
  [ClientSequentialEventType.SpawnEnvironmentModel]: {
    id: string;
    modelType: EnvironmentEntityName;
    position: Vector3;
    rotationQuat?: Quaternion;
  };
  [ClientSequentialEventType.DespawnEnvironmentModel]: { id: string };
  [ClientSequentialEventType.ClearAllModels]: undefined;
  [ClientSequentialEventType.ProcessReplayTree]: {
    actionUserId: EntityId;
    root: NestedNodeReplayEvent;
    doNotLockInput?: boolean;
  };
  [ClientSequentialEventType.ProcessBattleResult]: {
    conclusion: BattleConclusion;
    partyName: PartyName;
    experiencePointChanges: Record<CombatantId, number>;
    timestamp: number;
    actionEntitiesRemoved: EntityId[];
    loot?: undefined | { equipment: Equipment[]; consumables: Consumable[] };
  };
  [ClientSequentialEventType.PostGameMessages]: {
    messages: GameMessage[];
    partyChannelToExclude?: string;
  };
  [ClientSequentialEventType.RemovePlayerFromGame]: {
    username: Username;
  };
}

export type ClientSequentialEvent = {
  [K in keyof ClientSequentialEventMap]: {
    type: K;
    data: ClientSequentialEventMap[K];
  };
}[keyof ClientSequentialEventMap];

export type ClientSequentialEventHandler<K extends keyof ClientSequentialEventMap> = (
  data: ClientSequentialEventMap[K]
) => void | Promise<void>;

export type ClientSequentialEventHandlers = {
  [K in keyof ClientSequentialEventMap]: ClientSequentialEventHandler<K>;
};
