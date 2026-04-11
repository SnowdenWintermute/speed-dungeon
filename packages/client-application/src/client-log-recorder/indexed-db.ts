import {
  ClientIntent,
  ClientSequentialEvent,
  ClientSequentialEventType,
  GameStateUpdate,
  GameStateUpdateType,
  GameUpdateCommand,
  ReplayEventType,
} from "@speed-dungeon/common";
import { ClientLogEntry, ClientLogEntryKind, ClientLogRecorder } from ".";

const DB_NAME = "client-log";
const STORE_NAME = "entries";
const DB_VERSION = 1;

interface StoredRecord {
  byteLength: number;
  entry: ClientLogEntry;
}

export class IndexedDbClientLogRecorder implements ClientLogRecorder {
  private dbPromise: Promise<IDBDatabase>;
  private hydratePromise: Promise<void>;
  private totalBytes = 0;

  constructor(
    private readonly indexedDB: IDBFactory,
    private readonly maxBytes: number
  ) {
    this.dbPromise = this.open();
    this.hydratePromise = this.dbPromise.then((db) => this.hydrate(db));
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
    const db = await this.dbPromise;
    await this.hydratePromise;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records = request.result as StoredRecord[];
        resolve(records.map((r) => r.entry));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async exportAsJson(): Promise<string> {
    const entries = await this.getAllEntries();
    return JSON.stringify(entries, null, 2);
  }

  async clear(): Promise<void> {
    const db = await this.dbPromise;
    await this.hydratePromise;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.clear();

      tx.oncomplete = () => {
        this.totalBytes = 0;
        resolve();
      };
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  private put(entry: ClientLogEntry) {
    const record: StoredRecord = {
      byteLength: JSON.stringify(entry).length,
      entry,
    };
    this.totalBytes += record.byteLength;

    this.hydratePromise
      .then(() => this.dbPromise)
      .then((db) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put(record);

        if (this.totalBytes > this.maxBytes) this.evictOldestUntilUnderCap(store);
      })
      .catch((err) => {
        console.error("ClientLogRecorder put failed", err);
      });
  }

  private evictOldestUntilUnderCap(store: IDBObjectStore) {
    const cursorReq = store.openCursor();
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (!cursor) return;
      if (this.totalBytes <= this.maxBytes) return;
      const stored = cursor.value as StoredRecord;
      this.totalBytes -= stored.byteLength;
      cursor.delete();
      cursor.continue();
    };
  }

  private hydrate(db: IDBDatabase): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const cursorReq = store.openCursor();
      let total = 0;

      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) {
          this.totalBytes = total;
          resolve();
          return;
        }
        const stored = cursor.value as StoredRecord;
        total += stored.byteLength;
        cursor.continue();
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
  }

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = this.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { autoIncrement: true });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };

      request.onerror = () => reject(request.error);
    });
  }
}
