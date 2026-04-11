import { ClientIntent, GameStateUpdate, GameUpdateCommand } from "@speed-dungeon/common";

export enum ClientLogEntryKind {
  IntentDispatched,
  UpdateReceived,
  ReplayStepNominal,
}

export type ClientLogEntry =
  | {
      type: ClientLogEntryKind.IntentDispatched;
      timestamp: number;
      sequenceId: number;
      intent: ClientIntent;
    }
  | {
      type: ClientLogEntryKind.UpdateReceived;
      timestamp: number;
      update: GameStateUpdate;
    }
  | {
      type: ClientLogEntryKind.ReplayStepNominal;
      timestamp: number;
      command: GameUpdateCommand;
    };

export interface ClientLogRecorder {
  recordIntentDispatched(sequenceId: number, intent: ClientIntent): void;
  recordUpdateReceived(update: GameStateUpdate): void;
  recordReplayStepNominal(command: GameUpdateCommand): void;
  getAllEntries(): Promise<ClientLogEntry[]>;
  exportAsJson(): Promise<string>;
}
