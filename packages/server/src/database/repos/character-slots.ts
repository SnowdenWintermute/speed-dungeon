import format from "pg-format";
import { pgPool } from "../../singletons.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { toCamelCase } from "../utils.js";
import { DatabaseRepository } from "./index.js";

export type CharacterSlot = {
  id: string;
  profileId: number;
  slotNumber: number;
  characterId: string; // UUID
  createdAt: number | Date;
  updatedAt: number | Date;
};

const tableName = RESOURCE_NAMES.SPEED_DUNGEON_PROFILES;

class CharacterSlotsRepo extends DatabaseRepository<CharacterSlot> {
  async insert(profileId: number, slotNumber: number, characterId: string) {
    const { rows } = await this.pgPool.query(
      format(
        `INSERT INTO ${tableName} (profile_id, slot_number, character_id) VALUES (%L, %L, %L) RETURNING *;`,
        profileId,
        slotNumber,
        characterId
      )
    );
    if (!rows[0]) {
      console.error(`Failed to insert a new ${tableName} record`);
      return undefined;
    }
    const newSlot = toCamelCase(rows)[0] as unknown as CharacterSlot;

    return newSlot;
  }

  async update(characterSlot: CharacterSlot) {
    const { id, characterId } = characterSlot;
    const { rows } = await this.pgPool.query(
      format(
        `UPDATE ${tableName} SET character_id = %L WHERE id = %L RETURNING *;`,
        characterId,
        id
      )
    );

    if (rows[0]) return toCamelCase(rows)[0] as unknown as CharacterSlot;
    return undefined;
  }
}

export const characterSlotsRepo = new CharacterSlotsRepo(pgPool, tableName);
