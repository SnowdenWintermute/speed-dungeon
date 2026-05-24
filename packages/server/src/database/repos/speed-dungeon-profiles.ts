import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { toCamelCase } from "../utils.js";
import { DatabaseRepository } from "./index.js";
import {
  CharacterControlScheme,
  DEFAULT_ACCOUNT_CHARACTER_CAPACITY,
  DEFAULT_ACCOUNT_IRONMAN_RUN_CAPACITY,
  SpeedDungeonProfile,
} from "@speed-dungeon/common";

const tableName = RESOURCE_NAMES.SPEED_DUNGEON_PROFILES;

const defaultCharacterCapacities: Record<CharacterControlScheme, number> = {
  [CharacterControlScheme.Captain]: DEFAULT_ACCOUNT_CHARACTER_CAPACITY,
  [CharacterControlScheme.Freelancer]: DEFAULT_ACCOUNT_CHARACTER_CAPACITY,
};

export class SpeedDungeonProfileRepo extends DatabaseRepository<SpeedDungeonProfile> {
  async insert(ownerId: number) {
    const { rows } = await this.pgPool.query(
      format(
        `INSERT INTO ${tableName} (owner_id, character_capacities, ironman_run_capacity) VALUES (%L, %L, %L) RETURNING *;`,
        ownerId,
        JSON.stringify(defaultCharacterCapacities),
        DEFAULT_ACCOUNT_IRONMAN_RUN_CAPACITY
      )
    );
    if (!rows[0]) {
      console.error(`Failed to insert a new ${tableName} record`);
      return undefined;
    }
    const newProfile = toCamelCase(rows)[0] as unknown as SpeedDungeonProfile;

    return newProfile;
  }

  async update(speedDungeonProfile: SpeedDungeonProfile) {
    const { id, characterCapacities } = speedDungeonProfile;
    const { rows } = await this.pgPool.query(
      format(
        `UPDATE ${tableName} SET character_capacities = %L WHERE id = %L RETURNING *;`,
        JSON.stringify(characterCapacities),
        id
      )
    );

    if (rows[0]) return toCamelCase(rows)[0] as unknown as SpeedDungeonProfile;
    return undefined;
  }
}

export const speedDungeonProfilesRepo = new SpeedDungeonProfileRepo(pgPool, tableName);
