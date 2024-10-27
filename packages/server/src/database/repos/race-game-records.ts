import format from "pg-format";
import { pgPool } from "../../singletons.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { toCamelCase } from "../utils.js";
import { DatabaseRepository } from "./index.js";
import { SERVER_VERSION } from "../../index.js";
import { Combatant, CombatantProperties } from "@speed-dungeon/common";

export type RaceGameRecord = {
  id: string; // UUID
  name: string;
  ownerId: number;
  gameVersion: string;
  deepestFloorReached: number;
  combatantProperties: CombatantProperties;
  createdAt: number | Date;
  updatedAt: number | Date;
};

const tableName = RESOURCE_NAMES.RACE_GAME_RECORDS;

class RaceGameRecordRepo extends DatabaseRepository<RaceGameRecord> {
  async insert(combatant: Combatant, ownerId: number) {
    const { id, name } = combatant.entityProperties;
    const { combatantProperties } = combatant;
    const { rows } = await this.pgPool.query(
      format(
        `INSERT INTO ${tableName} (id, name, owner_id, combatant_properties, game_version) VALUES (%L, %L, %L, %L, %L) RETURNING *;`,
        id,
        name,
        ownerId,
        combatantProperties,
        SERVER_VERSION
      )
    );

    if (rows[0]) return toCamelCase(rows)[0] as unknown as RaceGameRecord;
    console.error(`Failed to insert a new ${tableName} record`);
    return undefined;
  }

  async update(raceGameRecord: RaceGameRecord) {
    const { id, ownerId, name, deepestFloorReached, combatantProperties } = raceGameRecord;
    const { rows } = await this.pgPool.query(
      format(
        `UPDATE ${tableName} SET owner_id = %L, name = %L, game_version = %L, deepest_floor_reached = %L, combatant_properties = %L WHERE id = %L RETURNING *;`,
        ownerId,
        name,
        SERVER_VERSION,
        deepestFloorReached,
        combatantProperties,
        id
      )
    );

    if (rows[0]) return toCamelCase(rows)[0] as unknown as RaceGameRecord;
    return undefined;
  }
}

export const raceGameRecordsRepo = new RaceGameRecordRepo(pgPool, tableName);
