import pg from "pg";

export default class WrappedPool {
  private _pool: pg.Pool | null = null;

  async connect(options: pg.PoolConfig) {
    this._pool = new pg.Pool(options);
    this._pool.on("error", (error) => {
      console.error("Connection with Postgres failed!");
      console.error(error);
    });
    console.log("pg pool created");
  }

  close() {
    return this._pool?.end();
  }

  query(sql: any, params?: any): any {
    return this._pool?.query(sql, params);
  }
}
