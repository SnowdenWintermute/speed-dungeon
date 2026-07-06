import pg from "pg";

export interface Queryable {
  query(sql: any, params?: any): any;
}

export default class WrappedPool implements Queryable {
  private _pool: pg.Pool | null = null;

  async connect(options: pg.PoolConfig) {
    this._pool = new pg.Pool(options);
    this._pool.on("error", (error) => {
      console.error("Connection with Postgres failed!");
      console.error(error);
    });
  }

  close() {
    return this._pool?.end();
  }

  query(sql: any, params?: any): any {
    return this._pool?.query(sql, params);
  }

  async withTransaction<T>(callback: (transaction: Queryable) => Promise<T>): Promise<T> {
    if (this._pool === null) throw new Error("Postgres pool is not connected");
    // a transaction must run on a single checked-out client, not the pool (which
    // would spread BEGIN/COMMIT across different connections). BEGIN/COMMIT/ROLLBACK
    // are plain SQL statements. release() returns the connection to the pool.
    const client = await this._pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      // don't let a failing ROLLBACK mask the error that actually caused the rollback
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("ROLLBACK failed", rollbackError);
      }
      throw error;
    } finally {
      client.release();
    }
  }
}
