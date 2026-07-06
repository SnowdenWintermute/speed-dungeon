import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { GameId, SavedIronmanRun, SerializedOf } from "@speed-dungeon/common";

const tableName = RESOURCE_NAMES.SAVED_IRONMAN_RUNS;

interface SavedIronmanRunRow {
  id: string;
  schema_version: string;
  saved_at: Date | string;
  game: SerializedOf<SavedIronmanRun>["_game"];
  user_ids_to_usernames: SerializedOf<SavedIronmanRun>["userIdsToUsernames"];
}

function rowToSerialized(row: SavedIronmanRunRow): SerializedOf<SavedIronmanRun> {
  const savedAt = row.saved_at instanceof Date ? row.saved_at.getTime() : Date.parse(row.saved_at);
  return {
    schemaVersion: row.schema_version,
    _game: row.game,
    userIdsToUsernames: row.user_ids_to_usernames,
    savedAt,
  };
}

export class SavedIronmanRunRepo extends DatabaseRepository<SerializedOf<SavedIronmanRun>> {
  async upsert(run: SerializedOf<SavedIronmanRun>) {
    const { rows } = await this.pgPool.query(
      format(
        `INSERT INTO ${tableName} (id, schema_version, saved_at, game, user_ids_to_usernames)
         VALUES (%L, %L, to_timestamp(%L::double precision / 1000.0), %L, %L)
         ON CONFLICT (id) DO UPDATE SET
           schema_version = EXCLUDED.schema_version,
           saved_at = EXCLUDED.saved_at,
           game = EXCLUDED.game,
           user_ids_to_usernames = EXCLUDED.user_ids_to_usernames
         RETURNING *;`,
        run._game.id,
        run.schemaVersion,
        run.savedAt,
        JSON.stringify(run._game),
        JSON.stringify(run.userIdsToUsernames)
      )
    );
    if (!rows[0]) {
      console.error(`Failed to upsert a ${tableName} record`);
      return undefined;
    }
    return rowToSerialized(rows[0] as SavedIronmanRunRow);
  }

  async fetchRunOption(runId: GameId): Promise<SerializedOf<SavedIronmanRun> | undefined> {
    const { rows } = await this.pgPool.query(
      format(`SELECT * FROM ${tableName} WHERE id = %L;`, runId)
    );
    if (!rows[0]) return undefined;
    return rowToSerialized(rows[0] as SavedIronmanRunRow);
  }

  async deleteById(runId: GameId): Promise<void> {
    await this.pgPool.query(format(`DELETE FROM ${tableName} WHERE id = %L;`, runId));
  }
}

export const savedIronmanRunsRepo = new SavedIronmanRunRepo(pgPool, tableName);
