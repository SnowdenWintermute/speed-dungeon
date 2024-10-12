import format from "pg-format";
import { pgPool } from "../../singletons.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { toCamelCase } from "../utils.js";
import { DatabaseRepository } from "./index.js";
import { SERVER_VERSION } from "../../index.js";
import { Combatant, CombatantProperties } from "@speed-dungeon/common";

export type PlayerCharacter = {
  id: string; // UUID
  name: string;
  ownerId: number;
  gameVersion: string;
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
    const { id, ownerId, name, gameVersion, combatantProperties } = playerCharacter;
    const { rows } = await this.pgPool.query(
      format(
        `UPDATE ${tableName} SET owner_id = %L, name = %L, game_version = %L, combatant_properties = %L WHERE id = %L RETURNING *;`,
        ownerId,
        name,
        gameVersion,
        combatantProperties,
        id
      )
    );

    if (rows[0]) return toCamelCase(rows)[0] as unknown as PlayerCharacter;
    return undefined;
  }
}

export const playerCharactersRepo = new PlayerCharacterRepo(
  pgPool,
  RESOURCE_NAMES.PLAYER_CHARACTERS
);
