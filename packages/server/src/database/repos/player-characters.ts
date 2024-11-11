import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { toCamelCase } from "../utils.js";
import { DatabaseRepository } from "./index.js";
import { Combatant, CombatantProperties } from "@speed-dungeon/common";
import { SERVER_VERSION } from "../../server-version.js";

export type PlayerCharacter = {
  id: string; // UUID
  name: string;
  ownerId: number;
  gameVersion: string;
  deepestFloorReached: number;
  combatantProperties: CombatantProperties;
  createdAt: number | Date;
  updatedAt: number | Date;
};

const tableName = RESOURCE_NAMES.PLAYER_CHARACTERS;

class PlayerCharacterRepo extends DatabaseRepository<PlayerCharacter> {
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

    if (rows[0]) return toCamelCase(rows)[0] as unknown as PlayerCharacter;
    console.error(`Failed to insert a new ${tableName} record`);
    return undefined;
  }

  async update(playerCharacter: PlayerCharacter) {
    const { id, ownerId, name, deepestFloorReached, combatantProperties } = playerCharacter;
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

    if (rows[0]) return toCamelCase(rows)[0] as unknown as PlayerCharacter;
    return undefined;
  }

  async getAllByLevel() {
    const { rows } = await this.pgPool.query(
      `
      SELECT id, combatant_properties->>'level' AS level, combatant_properties->>'hitPoints' AS hit_points
      FROM player_characters;
      `
    );

    if (rows[0])
      return toCamelCase(rows) as unknown as { id: string; level: number; hitPoints: number }[];
    return undefined;
  }
}

export const playerCharactersRepo = new PlayerCharacterRepo(pgPool, tableName);
