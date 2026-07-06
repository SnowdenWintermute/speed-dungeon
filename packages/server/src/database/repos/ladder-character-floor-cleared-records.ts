import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { Queryable } from "../wrapped-pool.js";
import {
  LadderCharacterFloorClearRecord,
  SerializedCombatantWithPets,
} from "@speed-dungeon/common";

const tableName = RESOURCE_NAMES.LADDER_CHARACTER_FLOOR_CLEARED_RECORDS;

export interface LadderCharacterFloorClearedRecordRow {
  id: string;
  characterRecordRef: string;
  partyFloorClearRecord: string;
  combatantSchemaVersion: string;
  combatantWithPets: SerializedCombatantWithPets;
}

class LadderCharacterFloorClearedRecordsRepo extends DatabaseRepository<LadderCharacterFloorClearedRecordRow> {
  async insert(record: LadderCharacterFloorClearRecord, executor: Queryable = this.pgPool) {
    await executor.query(
      format(
        `INSERT INTO ${tableName}
           (id, character_record_ref, party_floor_clear_record, combatant_schema_version, combatant_with_pets)
         VALUES (%L, %L, %L, %L, %L);`,
        record.id,
        record.characterRecordRef,
        record.partyFloorClearRecord,
        record.combatantSchemaVersion,
        JSON.stringify(record.combatantWithPets)
      )
    );
  }
}

export const ladderCharacterFloorClearedRecordsRepo = new LadderCharacterFloorClearedRecordsRepo(
  pgPool,
  tableName
);
