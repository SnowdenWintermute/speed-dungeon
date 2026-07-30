import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { Queryable } from "../wrapped-pool.js";
import {
  CombatantId,
  FloorClearSnapshotRef,
  LadderCharacterFloorClearRecord,
  LadderCharacterFloorClearRecordId,
  LadderPartyFloorClearRecordId,
  SerializedCombatantWithPets,
} from "@speed-dungeon/common";
import { toCamelCase } from "../utils.js";

const tableName = RESOURCE_NAMES.LADDER_CHARACTER_FLOOR_CLEARED_RECORDS;

export interface LadderCharacterFloorClearedRecordRow {
  id: string;
  characterRecordRef: string;
  partyFloorClearRecord: string;
  combatantSchemaVersion: string;
  combatantWithPets: SerializedCombatantWithPets;
}

class LadderCharacterFloorClearedRecordsRepo extends DatabaseRepository<LadderCharacterFloorClearedRecordRow> {
  async findRecordById(
    id: LadderCharacterFloorClearRecordId
  ): Promise<LadderCharacterFloorClearRecord | undefined> {
    const row = await this.findById(id);
    if (row === undefined) {
      return undefined;
    }
    return rowToRecord(row);
  }

  async findSnapshotRefsByPartyFloorClearIds(
    ids: LadderPartyFloorClearRecordId[]
  ): Promise<FloorClearSnapshotRef[]> {
    return this.findSnapshotRefsWhereIn("party_floor_clear_record", ids);
  }

  async findSnapshotRefsByCharacterIds(ids: CombatantId[]): Promise<FloorClearSnapshotRef[]> {
    return this.findSnapshotRefsWhereIn("character_record_ref", ids);
  }

  // deliberately not SELECT *: this table's combatant_with_pets column is the largest data in the
  // schema, and everything that links to a snapshot needs nothing from it but the ids
  private async findSnapshotRefsWhereIn(
    column: "party_floor_clear_record" | "character_record_ref",
    ids: string[]
  ): Promise<FloorClearSnapshotRef[]> {
    if (ids.length === 0) {
      return [];
    }
    const { rows } = await this.pgPool.query(
      format(
        `SELECT id, party_floor_clear_record, character_record_ref
         FROM ${tableName}
         WHERE ${column} IN (%L);`,
        ids
      )
    );
    return (
      toCamelCase(rows) as unknown as {
        id: string;
        partyFloorClearRecord: string;
        characterRecordRef: string;
      }[]
    ).map((row) => ({
      id: row.id as LadderCharacterFloorClearRecordId,
      partyFloorClearRecord: row.partyFloorClearRecord as LadderPartyFloorClearRecordId,
      characterRecordRef: row.characterRecordRef as CombatantId,
    }));
  }

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

function rowToRecord(row: LadderCharacterFloorClearedRecordRow): LadderCharacterFloorClearRecord {
  return {
    id: row.id as LadderCharacterFloorClearRecordId,
    combatantSchemaVersion: row.combatantSchemaVersion,
    partyFloorClearRecord: row.partyFloorClearRecord as LadderPartyFloorClearRecordId,
    characterRecordRef: row.characterRecordRef as CombatantId,
    combatantWithPets: row.combatantWithPets,
  };
}

export const ladderCharacterFloorClearedRecordsRepo = new LadderCharacterFloorClearedRecordsRepo(
  pgPool,
  tableName
);
