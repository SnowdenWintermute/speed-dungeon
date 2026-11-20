export class IndexedDbConnection {
  private connectionPromise: null | Promise<IDBDatabase> = null;
  private connectedDb: null | IDBDatabase = null;
  private operations = new Set<Promise<unknown>>();
  private deletion: null | Promise<void> = null;
  private disposed = false;

  constructor(
    private readonly indexedDB: IDBFactory,
    private readonly dbName: string,
    private readonly dbVersion: number,
    private readonly storeNames: string[]
  ) {}

  /** for reads that need a cursor or an index rather than a single key lookup. the transaction
   * opened this way isn't tracked, so a deletion issued once it's open won't wait for it */
  async requireDb(): Promise<IDBDatabase> {
    await this.awaitDeletion();
    return this.connect();
  }

  async getOption<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    return this.read<T | undefined>(storeName, (store) => store.get(key));
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    return this.read<T[]>(storeName, (store) => store.getAll());
  }

  async getAllKeys<T extends IDBValidKey>(storeName: string): Promise<T[]> {
    const keys = await this.read(storeName, (store) => store.getAllKeys());
    return keys as T[];
  }

  /** for stores created without a keyPath or autoIncrement, whose keys live outside the value */
  async put(storeName: string, key: IDBValidKey, value: unknown) {
    await this.write(storeName, (store) => store.put(value, key));
  }

  async delete(storeName: string, key: IDBValidKey) {
    await this.write(storeName, (store) => store.delete(key));
  }

  async clear(storeName: string) {
    await this.write(storeName, (store) => store.clear());
  }

  /** waits for the operations already in flight, drops the whole database, and leaves the next
   * operation to reconnect. operations issued meanwhile queue behind it and land in the new
   * database */
  async deleteDatabase() {
    if (this.disposed) {
      return;
    }
    if (this.deletion === null) {
      this.deletion = this.runDeletion().finally(() => {
        this.deletion = null;
      });
    }
    return this.deletion;
  }

  dispose() {
    this.disposed = true;
    const connection = this.connectionPromise;
    this.connectionPromise = null;
    this.connectedDb = null;
    connection?.then((db) => db.close()).catch(() => {});
  }

  awaitRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async read<T>(
    storeName: string,
    issue: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    return this.operate((db) => {
      const store = db.transaction(storeName, "readonly").objectStore(storeName);
      return this.awaitRequest(issue(store));
    });
  }

  /** resolves on commit rather than on the request, so a transaction that aborts as it commits -
   * exceeding the storage quota, most likely - can't be reported as a successful write */
  private async write(
    storeName: string,
    issue: (store: IDBObjectStore) => IDBRequest
  ): Promise<void> {
    return this.operate((db) => {
      const transaction = db.transaction(storeName, "readwrite");
      const request = issue(transaction.objectStore(storeName));

      return new Promise<void>((resolve, reject) => {
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => resolve();
        transaction.onabort = () =>
          reject(transaction.error ?? new Error(`Write aborted on database: ${this.dbName}`));
      });
    });
  }

  /** only tracked once it holds a transaction, so a deletion waiting on the tracked operations
   * can't end up waiting on one that is itself waiting on that deletion */
  private async operate<T>(run: (db: IDBDatabase) => Promise<T>): Promise<T> {
    await this.awaitDeletion();
    const db = await this.connect();
    if (this.deletion !== null) {
      return this.operate(run);
    }

    const operation = run(db);
    this.operations.add(operation);
    return operation.finally(() => {
      this.operations.delete(operation);
    });
  }

  private async awaitDeletion() {
    while (this.deletion !== null) {
      await this.deletion.catch(() => {});
    }
  }

  private async runDeletion() {
    // taken before the first await, so it holds only the transactions already open. anything
    // newer waits on this deletion instead, and awaiting those here would deadlock
    const inFlight = [...this.operations];
    await Promise.allSettled(inFlight);
    this.closeConnection();

    await new Promise<void>((resolve, reject) => {
      const request = this.indexedDB.deleteDatabase(this.dbName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      // the request stays pending until the connections holding it up close, so it still has a
      // success or an error left to deliver
      request.onblocked = () =>
        console.warn(`Deletion blocked by another connection to database: ${this.dbName}`);
    });
  }

  private connect(): Promise<IDBDatabase> {
    if (this.disposed) {
      throw new Error(`Connection disposed for database: ${this.dbName}`);
    }

    if (this.connectionPromise === null) {
      const connection = this.open().catch((error) => {
        // a failed open isn't kept, so the next operation gets a fresh attempt
        if (this.connectionPromise === connection) {
          this.connectionPromise = null;
        }
        throw error;
      });
      this.connectionPromise = connection;
    }

    return this.connectionPromise;
  }

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = this.indexedDB.open(this.dbName, this.dbVersion);
      let settled = false;

      request.onupgradeneeded = () => {
        const db = request.result;
        for (const storeName of this.storeNames) {
          if (db.objectStoreNames.contains(storeName)) {
            db.deleteObjectStore(storeName);
          }
          db.createObjectStore(storeName);
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        // the open outlived the promise it was made for, so nothing else will ever close it
        if (settled) {
          db.close();
          return;
        }
        settled = true;

        const missingStoreNames = this.storeNames.filter(
          (storeName) => !db.objectStoreNames.contains(storeName)
        );
        if (missingStoreNames.length) {
          db.close();
          reject(
            new Error(
              `Database ${this.dbName} at version ${this.dbVersion} is missing stores: ` +
                `${missingStoreNames.join(", ")}. Bump its version to create them.`
            )
          );
          return;
        }

        db.onversionchange = () => {
          db.close();
          this.forget(db);
        };
        db.onclose = () => this.forget(db);

        this.connectedDb = db;
        resolve(db);
      };

      request.onerror = () => {
        settled = true;
        reject(request.error);
      };

      request.onblocked = () => {
        settled = true;
        reject(new Error(`Connection blocked for database: ${this.dbName}`));
      };
    });
  }

  private closeConnection() {
    this.connectedDb?.close();
    this.connectedDb = null;
    this.connectionPromise = null;
  }

  private forget(db: IDBDatabase) {
    if (this.connectedDb !== db) {
      return;
    }
    this.connectedDb = null;
    this.connectionPromise = null;
  }
}
