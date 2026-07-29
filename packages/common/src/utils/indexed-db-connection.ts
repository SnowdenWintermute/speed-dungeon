/** Owns an IndexedDB connection and wraps its request objects in promises. Held as a field by
 * stores that persist to IndexedDB, which extend their own domain port rather than this.
 *
 * Every store it creates takes keys chosen by the caller, so a record is found by the same key
 * it was written with. Stores that let IndexedDB derive or generate keys are not served here. */
export class IndexedDbConnection {
  private dbPromise: Promise<IDBDatabase>;
  private disposed = false;

  constructor(
    private readonly indexedDB: IDBFactory,
    private readonly dbName: string,
    private readonly dbVersion: number,
    private readonly storeNames: string[]
  ) {
    this.dbPromise = this.open();
  }

  /** for reads that need a cursor or an index rather than a single key lookup */
  requireDb() {
    return this.dbPromise;
  }

  async getOption<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.dbPromise;
    return this.awaitRequest<T | undefined>(
      db.transaction(storeName, "readonly").objectStore(storeName).get(key)
    );
  }

  /** for stores created without a keyPath or autoIncrement, whose keys live outside the value */
  async put(storeName: string, key: IDBValidKey, value: unknown) {
    const db = await this.dbPromise;
    const store = db.transaction(storeName, "readwrite").objectStore(storeName);
    await this.awaitRequest(store.put(value, key));
  }

  async delete(storeName: string, key: IDBValidKey) {
    const db = await this.dbPromise;
    await this.awaitRequest(
      db.transaction(storeName, "readwrite").objectStore(storeName).delete(key)
    );
  }

  async clear(storeName: string) {
    const db = await this.dbPromise;
    await this.awaitRequest(db.transaction(storeName, "readwrite").objectStore(storeName).clear());
  }

  /** closes the connection, drops the whole database, then reconnects */
  async deleteDatabase() {
    if (this.disposed) {
      return;
    }
    const db = await this.dbPromise;
    db.close();

    await new Promise<void>((resolve, reject) => {
      const request = this.indexedDB.deleteDatabase(this.dbName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error(`Deletion blocked for database: ${this.dbName}`));
    });

    this.dbPromise = this.open();
  }

  dispose() {
    this.disposed = true;
    this.dbPromise.then((db) => db.close()).catch(() => {});
  }

  awaitRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = this.indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = () => {
        const db = request.result;
        for (const storeName of this.storeNames) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
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
