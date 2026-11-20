import { IDBFactory } from "fake-indexeddb";
import { IndexedDbConnection } from "./indexed-db-connection.js";

const DB_NAME = "test-db";
const STORE_NAME = "records";
const DB_VERSION = 1;

function createConnection(indexedDB: IDBFactory) {
  return new IndexedDbConnection(indexedDB, DB_NAME, DB_VERSION, [STORE_NAME]);
}

/** a connection the class under test doesn't know about, standing in for another tab */
function openUnmanagedConnection(indexedDB: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

describe("IndexedDbConnection", () => {
  let indexedDB: IDBFactory;
  let connection: IndexedDbConnection;

  beforeEach(() => {
    indexedDB = new IDBFactory();
    connection = createConnection(indexedDB);
  });

  afterEach(() => {
    connection.dispose();
  });

  it("writes and reads back by the key it was given", async () => {
    await connection.put(STORE_NAME, "a", { value: 1 });
    expect(await connection.getOption(STORE_NAME, "a")).toEqual({ value: 1 });
  });

  it("reopens after another connection deletes the database out from under it", async () => {
    await connection.put(STORE_NAME, "a", { value: 1 });

    // deleting from elsewhere fires versionchange, which closes our connection
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("connection failed to close on versionchange"));
    });

    await connection.put(STORE_NAME, "b", { value: 2 });
    expect(await connection.getOption(STORE_NAME, "b")).toEqual({ value: 2 });
  });

  it("serves writes issued while its own deleteDatabase is in flight", async () => {
    await connection.put(STORE_NAME, "a", { value: 1 });

    const deletion = connection.deleteDatabase();
    const write = connection.put(STORE_NAME, "b", { value: 2 });

    await Promise.all([deletion, write]);

    expect(await connection.getOption(STORE_NAME, "a")).toBeUndefined();
    expect(await connection.getOption(STORE_NAME, "b")).toEqual({ value: 2 });
  });

  it("serves a deletion issued the moment the one a write was queued behind resolves", async () => {
    await connection.put(STORE_NAME, "a", { value: 1 });

    // waiting on the first deletion before the write does means this runs while the write is still
    // queued, so the second deletion must not wait on it
    const deletions = connection.deleteDatabase().then(() => connection.deleteDatabase());
    const write = connection.put(STORE_NAME, "b", { value: 2 });

    await deletions;
    await write;

    expect(await connection.getOption(STORE_NAME, "a")).toBeUndefined();
  });

  it("completes a deletion another connection blocked, once that connection closes", async () => {
    await connection.put(STORE_NAME, "a", { value: 1 });
    const blocker = await openUnmanagedConnection(indexedDB);

    const deletion = connection.deleteDatabase();
    const write = connection.put(STORE_NAME, "b", { value: 2 });
    setTimeout(() => blocker.close(), 0);

    await Promise.all([deletion, write]);

    expect(await connection.getOption(STORE_NAME, "a")).toBeUndefined();
    expect(await connection.getOption(STORE_NAME, "b")).toEqual({ value: 2 });
  });

  it("hands out a database only once an in-flight deletion has finished", async () => {
    await connection.put(STORE_NAME, "a", { value: 1 });

    const deletion = connection.deleteDatabase();
    const db = await connection.requireDb();
    await deletion;

    const store = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME);
    expect(await connection.awaitRequest(store.getAll())).toEqual([]);
  });

  it("names the stores a database at its version was created without", async () => {
    // stands in for a store added to the list without bumping the version, which leaves anyone
    // holding the older database without it
    const storeless = await openUnmanagedConnection(indexedDB);
    storeless.close();

    await expect(connection.getAll(STORE_NAME)).rejects.toThrow(STORE_NAME);
  });

  it("rejects with the database name once disposed, rather than a closing-connection error", async () => {
    await connection.put(STORE_NAME, "a", { value: 1 });
    connection.dispose();

    await expect(connection.put(STORE_NAME, "b", { value: 2 })).rejects.toThrow(DB_NAME);
  });
});
