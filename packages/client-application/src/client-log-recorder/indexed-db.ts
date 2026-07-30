import {
  ActionIntentAndUserId,
  APP_VERSION_NUMBER,
  ClientIntent,
  ClientSequentialEvent,
  ClientSequentialEventType,
  CombatActionExecutionIntent,
  EntityId,
  GameStateUpdate,
  GameStateUpdateType,
  GameUpdateCommand,
  IndexedDbConnection,
  ReplayEventType,
} from "@speed-dungeon/common";
import { ClientLogEntry, ClientLogEntryKind, ClientLogRecorder } from ".";
import { makeAutoObservable } from "mobx";

const DB_NAME = "client-log";
const STORE_NAME = "entries";
const DB_VERSION = 2;

interface StoredRecord {
  byteLength: number;
  entry: ClientLogEntry;
}

export class IndexedDbClientLogRecorder implements ClientLogRecorder {
  private connection: IndexedDbConnection;
  /** entries are keyed by insertion order, so a write can't start before hydrate seeds the counter */
  private writeQueue: Promise<void>;
  private nextKey = 0;
  private _totalBytes = 0;
  private _combatantActionsHistory: ActionIntentAndUserId[] = [];
  private disposed = false;

  constructor(indexedDB: IDBFactory, private readonly maxBytes: number) {
    this.connection = new IndexedDbConnection(indexedDB, DB_NAME, DB_VERSION, [STORE_NAME]);
    this.writeQueue = this.hydrate();
    this.put({
      type: ClientLogEntryKind.SessionStarted,
      timestamp: Date.now(),
      appVersion: APP_VERSION_NUMBER,
    });

    makeAutoObservable(this);
  }

  get logSizeBytes() {
    return this._totalBytes;
  }

  /** mutations happen in promise continuations, so they need their own action boundary */
  private setTotalBytes(value: number) {
    this._totalBytes = value;
  }

  recordCombatantActionSelected(
    userId: EntityId,
    actionExecutionIntent: CombatActionExecutionIntent
  ) {
    this._combatantActionsHistory.push({ userId, actionExecutionIntent });
  }

  get combatantActionsHistory() {
    return this._combatantActionsHistory;
  }

  recordIntentDispatched(sequenceId: number, intent: ClientIntent) {
    this.put({
      type: ClientLogEntryKind.IntentDispatched,
      timestamp: Date.now(),
      sequenceId,
      intent,
    });
  }

  recordUpdateReceived(update: GameStateUpdate) {
    this.put({
      type: ClientLogEntryKind.UpdateReceived,
      timestamp: Date.now(),
      update: this.sanitizeUpdate(update),
    });
  }

  private sanitizeUpdate(update: GameStateUpdate): GameStateUpdate {
    if (update.type !== GameStateUpdateType.ClientSequentialEvents) return update;

    const sanitizedEvents = update.data.sequentialEvents.map((event): ClientSequentialEvent => {
      if (event.type !== ClientSequentialEventType.ProcessReplayTree) return event;
      return {
        type: ClientSequentialEventType.ProcessReplayTree,
        data: {
          ...event.data,
          root: { type: ReplayEventType.NestedNode, events: [] },
        },
      };
    });

    return {
      type: GameStateUpdateType.ClientSequentialEvents,
      data: { sequentialEvents: sanitizedEvents },
    };
  }

  recordReplayStepNominal(command: GameUpdateCommand) {
    this.put({
      type: ClientLogEntryKind.ReplayStepNominal,
      timestamp: Date.now(),
      command,
    });
  }

  async getAllEntries(): Promise<ClientLogEntry[]> {
    await this.writeQueue;
    const records = await this.connection.getAll<StoredRecord>(STORE_NAME);
    return records.map((record) => record.entry);
  }

  async exportAsJson(): Promise<string> {
    const entries = await this.getAllEntries();
    return JSON.stringify(entries);
  }

  async clear(): Promise<void> {
    await this.writeQueue;
    await this.connection.clear(STORE_NAME);
    this.setTotalBytes(0);
    this.nextKey = 0;
  }

  dispose() {
    this.disposed = true;
    this.connection.dispose();
  }

  private put(entry: ClientLogEntry) {
    if (this.disposed) {
      return;
    }
    const record: StoredRecord = {
      byteLength: JSON.stringify(entry).length,
      entry,
    };
    this.setTotalBytes(this._totalBytes + record.byteLength);

    this.writeQueue = this.writeQueue
      .then(() => this.write(record))
      .catch((err) => {
        console.error("ClientLogRecorder put failed", err);
      });
  }

  private async write(record: StoredRecord) {
    await this.connection.put(STORE_NAME, this.nextKey, record);
    this.nextKey += 1;

    if (this._totalBytes > this.maxBytes) {
      await this.evictOldestUntilUnderCap();
    }
  }

  private async evictOldestUntilUnderCap() {
    const db = await this.connection.requireDb();
    const store = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME);

    return new Promise<void>((resolve, reject) => {
      const cursorRequest = store.openCursor();

      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (!cursor || this._totalBytes <= this.maxBytes) {
          resolve();
          return;
        }
        const stored = cursor.value as StoredRecord;
        this.setTotalBytes(this._totalBytes - stored.byteLength);
        cursor.delete();
        cursor.continue();
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  }

  private async hydrate(): Promise<void> {
    const records = await this.connection.getAll<StoredRecord>(STORE_NAME);
    this.setTotalBytes(records.reduce((total, record) => total + record.byteLength, 0));

    const keys = await this.connection.getAllKeys<number>(STORE_NAME);
    const highestKey = keys[keys.length - 1];
    this.nextKey = highestKey === undefined ? 0 : highestKey + 1;
  }
}
