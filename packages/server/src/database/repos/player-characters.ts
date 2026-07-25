import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { toCamelCase } from "../utils.js";
import { DatabaseRepository } from "./index.js";
import {
  CharacterControlScheme,
  Combatant,
  SerializedPlayerCharacter,
} from "@speed-dungeon/common";
import { SERVER_VERSION } from "../../server-version.js";

const tableName = RESOURCE_NAMES.PLAYER_CHARACTERS;

export class PlayerCharacterRepo extends DatabaseRepository<SerializedPlayerCharacter> {
  async insert(
    combatant: Combatant,
    pets: Combatant[],
    ownerId: number,
    controlScheme: CharacterControlScheme
  ) {
    const { id, name } = combatant.entityProperties;
    const { combatantProperties } = combatant.toSerialized();

    const petsAsJSON = JSON.stringify(pets.map((pet) => pet.toSerialized()));

    const { rows } = await this.pgPool.query(
      format(
        `INSERT INTO ${tableName}
         (id, name, owner_id, control_scheme, combatant_properties, pets, game_version)
         VALUES (%L, %L, %L, %L, %L, %L, %L)
         RETURNING *;`,
        id,
        name,
        ownerId,
        controlScheme,
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

  async findByOwnerAndControlScheme(
    ownerId: number,
    controlScheme: CharacterControlScheme
  ): Promise<SerializedPlayerCharacter[]> {
    const { rows } = await this.pgPool.query(
      format(
        `SELECT * FROM ${tableName} WHERE owner_id = %L AND control_scheme = %L;`,
        ownerId,
        controlScheme
      )
    );
    return toCamelCase(rows) as unknown as SerializedPlayerCharacter[];
  }

  async findByIds(characterIds: string[]): Promise<SerializedPlayerCharacter[]> {
    if (characterIds.length === 0) {
      return [];
    }
    const { rows } = await this.pgPool.query(
      format(`SELECT * FROM ${tableName} WHERE id IN (%L);`, characterIds)
    );
    return toCamelCase(rows) as unknown as SerializedPlayerCharacter[];
  }

  // everything the experience points ladders are rebuilt from at boot
  async getAllCharacterExperienceScores() {
    const { rows } = await this.pgPool.query(
      `
      SELECT id, control_scheme,
      ( combatant_properties->'classProgressionProperties'->'mainClass'->>'level' )::int AS level,
      ( combatant_properties->'classProgressionProperties'->'experiencePoints'->>'current' )::int AS experience_points,
      combatant_properties->'resources'->>'hitPoints' AS hit_points
      FROM player_characters;
      `
    );

    if (rows[0])
      return toCamelCase(rows) as unknown as {
        id: string;
        controlScheme: CharacterControlScheme;
        level: number;
        experiencePoints: number;
        hitPoints: number;
      }[];
    return undefined;
  }
}

export const playerCharactersRepo = new PlayerCharacterRepo(pgPool, tableName);
