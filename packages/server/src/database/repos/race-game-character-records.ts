import format from "pg-format";
import { pgPool } from "../../singletons.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { Combatant, formatCombatantClassName } from "@speed-dungeon/common";

export type RaceGameCharacterRecord = {
  id: number;
  partyId: number;
  characterName: string;
  level: number;
  combatantClass: string;
  idOfControllingUser: string; // UUID
};

const tableName = RESOURCE_NAMES.RACE_GAME_CHARACTER_RECORDS;

class RaceGameCharacterRecordRepo extends DatabaseRepository<RaceGameCharacterRecord> {
  async insert(
    character: Combatant,
    partyRecordId: string,
    controllingPlayerIdOption: null | number
  ) {
    const { rows } = await this.pgPool.query(
      format(
        `INSERT INTO race_game_character_records
        (id, party_id, character_name, level, combatant_class, id_of_controlling_user)
        VALUES (%L ,%L, %L, %L, %L, %L) RETURNING *;`,
        character.entityProperties.id,
        partyRecordId,
        character.entityProperties.name,
        character.combatantProperties.level,
        formatCombatantClassName(character.combatantProperties.combatantClass).toLowerCase(),
        controllingPlayerIdOption || null
      )
    );
  }

  async update(character: Combatant) {
    const { rows } = await this.pgPool.query(
      format(
        `
        UPDATE race_game_character_records
        SET level = %L
        WHERE id = %L;
       `,
        character.combatantProperties.level,
        character.entityProperties.id
      )
    );
  }
}

export const raceGameCharacterRecordsRepo = new RaceGameCharacterRecordRepo(pgPool, tableName);
