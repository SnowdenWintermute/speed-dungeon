import format from "pg-format";
import { pgPool } from "../../singletons.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { toCamelCase } from "../utils.js";
import { DatabaseRepository } from "./index.js";
import { SERVER_VERSION } from "../../index.js";
import { Combatant, DEFAULT_ACCOUNT_CHARACTER_CAPACITY } from "@speed-dungeon/common";

export type SpeedDungeonProfile = {
  id: string; // UUID
  ownerId: number;
  characterCapacity: number;
  createdAt: number | Date;
  updatedAt: number | Date;
};

const tableName = RESOURCE_NAMES.SPEED_DUNGEON_PROFILES;

class SpeedDungeonProfileRepo extends DatabaseRepository<SpeedDungeonProfile> {
  async insert(ownerId: number) {
    const { rows } = await this.pgPool.query(
      format(
        `INSERT INTO ${tableName} (owner_id, character_capacity) VALUES (%L, %L) RETURNING *;`,
        ownerId,
        DEFAULT_ACCOUNT_CHARACTER_CAPACITY
      )
    );

    if (rows[0]) return toCamelCase(rows)[0] as unknown as SpeedDungeonProfile;
    console.error(`Failed to insert a new ${tableName} record`);
    return undefined;
  }

  async update(speedDungeonProfile: SpeedDungeonProfile) {
    const { id, characterCapacity } = speedDungeonProfile;
    const { rows } = await this.pgPool.query(
      format(
        `UPDATE ${tableName} SET character_capacity = %L WHERE id = %L RETURNING *;`,
        characterCapacity,
        id
      )
    );

    if (rows[0]) return toCamelCase(rows)[0] as unknown as SpeedDungeonProfile;
    return undefined;
  }
}

export const speedDungeonProfilesRepo = new SpeedDungeonProfileRepo(pgPool, tableName);
