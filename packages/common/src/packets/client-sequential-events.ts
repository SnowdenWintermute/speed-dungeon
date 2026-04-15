import { Quaternion, Vector3 } from "@babylonjs/core";
import { CombatantId, EntityId, Username } from "../aliases";
import { EnvironmentEntityName } from "../environment-entities";
import { NestedNodeReplayEvent } from "../action-processing/replay-events";
import { GameMessage } from "./game-message";
import { SerializedOf } from "../serialization";
import { CombatActionExecutionIntent } from "../combat/combat-actions/combat-action-execution-intent";

export enum ClientSequentialEventType {
  ClearAllModels,
  SynchronizeCombatantEquipmentModels,
  SynchronizeCombatantModels,
  SpawnEnvironmentModel,
  DespawnEnvironmentModel,
  ProcessReplayTree,
  PostGameMessages,
  RemovePlayerFromGame,
  RecordAiActionSelected,
}

export const CLIENT_EVENT_TYPE_STRINGS: Record<ClientSequentialEventType, string> = {
  [ClientSequentialEventType.SynchronizeCombatantEquipmentModels]:
    "Synchronize Combatant Equipment Models",
  [ClientSequentialEventType.SynchronizeCombatantModels]: "Synchronize Combatant Models",
  [ClientSequentialEventType.SpawnEnvironmentModel]: "Spawn Environment Model",
  [ClientSequentialEventType.DespawnEnvironmentModel]: "Despawn Environment Model",
  [ClientSequentialEventType.ClearAllModels]: "Clear All Models",
  [ClientSequentialEventType.ProcessReplayTree]: "Process Replay Tree",
  [ClientSequentialEventType.PostGameMessages]: "Post Game Messages",
  [ClientSequentialEventType.RemovePlayerFromGame]: "Remove Player From Game",
  [ClientSequentialEventType.RecordAiActionSelected]: "Record AI Action Selected",
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
  [ClientSequentialEventType.PostGameMessages]: {
    messages: GameMessage[];
    partyChannelToExclude?: string;
  };
  [ClientSequentialEventType.RemovePlayerFromGame]: {
    username: Username;
  };
  [ClientSequentialEventType.RecordAiActionSelected]: {
    userId: EntityId;
    actionExecutionIntent: CombatActionExecutionIntent;
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
