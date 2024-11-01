import migrate from "node-pg-migrate";
import format from "pg-format";
import { pgOptionsTestDB, TEST_DB_NAME } from "../database/config.js";
import { pgPool } from "../singletons.js";

export default class PGTestingContext {
  roleName: string;
  static async build(roleName: string) {
    roleName = `a${roleName}`; // pg requires role names start with a letter
    await pgPool.connect(pgOptionsTestDB);
    await pgPool.query(format(`CREATE ROLE %I WITH LOGIN PASSWORD %L;`, roleName, roleName));
    await pgPool.query(format(`CREATE SCHEMA %I AUTHORIZATION %I;`, roleName, roleName));
    await pgPool.close();
    await migrate({
      schema: roleName,
      direction: "up",
      log: () => {},
      noLock: true,
      dir: "./src/database/migrations",
      databaseUrl: {
        host: "localhost",
        port: 5433,
        database: TEST_DB_NAME,
        user: roleName,
        password: roleName,
      },
      migrationsTable: "migrations",
    });
    await pgPool.connect({
      host: "localhost",
      port: 5433,
      database: TEST_DB_NAME,
      user: roleName,
      password: roleName,
    });
    return new PGTestingContext(roleName);
  }

  async cleanup() {
    await pgPool.close();
    await pgPool.connect(pgOptionsTestDB);
    await pgPool.query(format("DROP SCHEMA %I CASCADE;", this.roleName));
    await pgPool.query(format("DROP ROLE %I;", this.roleName));
    await pgPool.close();
  }

  constructor(roleName: string) {
    this.roleName = roleName;
  }
}
