import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import migrate from "node-pg-migrate";
import path from "path";
import { fileURLToPath } from "url";
import {
  DatabaseLadderRecordsPersistenceStrategy,
  RESOURCE_NAMES,
  pgPool,
} from "@speed-dungeon/server";
import { LadderRecordsPersistenceStrategy } from "@speed-dungeon/common";

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../server/src/database/migrations"
);

const LADDER_TABLES = [
  RESOURCE_NAMES.LADDER_GAME_RECORDS,
  RESOURCE_NAMES.LADDER_GAME_PARTICIPATION_RECORDS,
  RESOURCE_NAMES.LADDER_PARTICIPANT_RECORDS,
  RESOURCE_NAMES.LADDER_PARTY_RECORDS,
  RESOURCE_NAMES.LADDER_PARTY_FLOOR_CLEAR_RECORDS,
  RESOURCE_NAMES.LADDER_CHARACTER_RECORDS,
  RESOURCE_NAMES.LADDER_CHARACTER_FLOOR_CLEARED_RECORDS,
];

export class PostgresTestDatabase {
  private container: StartedPostgreSqlContainer | null = null;

  async start() {
    this.container = await new PostgreSqlContainer("postgres:16").start();
    const databaseUrl = this.container.getConnectionUri();
    await migrate({
      databaseUrl,
      dir: MIGRATIONS_DIR,
      direction: "up",
      migrationsTable: "pgmigrations",
    });
    await pgPool.connect({ connectionString: databaseUrl });
  }

  createLadderPersistenceStrategy(): LadderRecordsPersistenceStrategy {
    return new DatabaseLadderRecordsPersistenceStrategy();
  }

  async truncateAllLadderTables() {
    await pgPool.query(`TRUNCATE ${LADDER_TABLES.join(", ")} RESTART IDENTITY CASCADE`);
  }

  async stop() {
    await pgPool.close();
    await this.container?.stop();
  }
}
