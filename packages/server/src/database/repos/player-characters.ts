import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { toCamelCase } from "../utils.js";
import { DatabaseRepository } from "./index.js";
import { Combatant, SerializedPlayerCharacter } from "@speed-dungeon/common";
import { SERVER_VERSION } from "../../server-version.js";

const tableName = RESOURCE_NAMES.PLAYER_CHARACTERS;

export class PlayerCharacterRepo extends DatabaseRepository<SerializedPlayerCharacter> {
  async insert(combatant: Combatant, pets: Combatant[], ownerId: number) {
    const { id, name } = combatant.entityProperties;
    const { combatantProperties } = combatant.toSerialized();

    const petsAsJSON = JSON.stringify(pets.map((pet) => pet.toSerialized()));

    const { rows } = await this.pgPool.query(
      format(
        `INSERT INTO ${tableName} 
         (id, name, owner_id, combatant_properties, pets, game_version) 
         VALUES (%L, %L, %L, %L, %L, %L) 
         RETURNING *;`,
        id,
        name,
        ownerId,
        combatantProperties,
        petsAsJSON,
        SERVER_VERSION
      )
    );

    const insertedCharacterOption = rows[0];
    if (insertedCharacterOption) {
      return toCamelCase(rows)[0] as unknown as SerializedPlayerCharacter;
    } else {
      console.error(`Failed to insert a new ${tableName} record`);
      return undefined;
    }
  }

  async update(playerCharacter: SerializedPlayerCharacter, pets: Combatant[]) {
    const { id, ownerId, name, combatantProperties } = playerCharacter;

    const petsAsJSON = JSON.stringify(pets.map((pet) => pet.toSerialized()));
    const { rows } = await this.pgPool.query(
      format(
        `UPDATE ${tableName} 
         SET owner_id = %L, 
         name = %L,
         game_version = %L,
         combatant_properties = %L,
         pets = %L
         WHERE id = %L RETURNING *;`,
        ownerId,
        name,
        SERVER_VERSION,
        combatantProperties,
        petsAsJSON,
        id
      )
    );

    if (rows[0]) return toCamelCase(rows)[0] as unknown as SerializedPlayerCharacter;
    return undefined;
  }

  async getAllByLevel() {
    const { rows } = await this.pgPool.query(
      `
      SELECT id, ( combatant_properties->>'level' )::int AS level,
      ( combatant_properties->'experiencePoints'->>'current' )::int AS experience_points,
      combatant_properties->>'hitPoints' AS hit_points
      FROM player_characters;
      `
    );

    if (rows[0])
      return toCamelCase(rows) as unknown as {
        id: string;
        level: number;
        experiencePoints: number;
        hitPoints: number;
      }[];
    return undefined;
  }
}

export const playerCharactersRepo = new PlayerCharacterRepo(pgPool, tableName);
