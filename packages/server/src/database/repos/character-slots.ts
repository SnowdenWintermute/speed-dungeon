import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { toCamelCase } from "../utils.js";
import { DatabaseRepository } from "./index.js";
import { CharacterControlScheme, CharacterSlot } from "@speed-dungeon/common";

const tableName = RESOURCE_NAMES.CHARACTER_SLOTS;

export class CharacterSlotsRepo extends DatabaseRepository<CharacterSlot> {
  async insert(
    profileId: number,
    controlScheme: CharacterControlScheme,
    slotNumber: number,
    characterId: string | null
  ) {
    const { rows } = await this.pgPool.query(
      format(
        `INSERT INTO ${tableName} (profile_id, control_scheme, slot_number, character_id) VALUES (%L, %L, %L, %L) RETURNING *;`,
        profileId,
        controlScheme,
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

  async getSlot(
    profileId: number,
    controlScheme: CharacterControlScheme,
    slotNumber: number
  ) {
    const { rows } = await this.pgPool.query(
      format(
        `SELECT * FROM ${tableName} WHERE profile_id = %L AND control_scheme = %L AND slot_number = %L;`,
        profileId,
        controlScheme,
        slotNumber
      )
    );

    if (rows[0]) return toCamelCase(rows)[0] as unknown as CharacterSlot;
    return undefined;
  }

  async findByProfileAndScheme(profileId: number, controlScheme: CharacterControlScheme) {
    const { rows } = await this.pgPool.query(
      format(
        `SELECT * FROM ${tableName} WHERE profile_id = %L AND control_scheme = %L;`,
        profileId,
        controlScheme
      )
    );

    if (rows[0]) return toCamelCase(rows) as unknown as CharacterSlot[];
    return undefined;
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
