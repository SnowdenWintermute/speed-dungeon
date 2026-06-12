import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { Queryable } from "../wrapped-pool.js";
import {
  COMBATANT_CLASS_NAME_STRINGS,
  CombatantClass,
  LadderCharacterRecord,
  LadderCharacterRecordId,
} from "@speed-dungeon/common";

const tableName = RESOURCE_NAMES.LADDER_CHARACTER_RECORDS;

export interface LadderCharacterRecordRow {
  id: string;
  partyRecordId: string;
  controllingPlayerId: string | null;
  name: string;
  mainClass: string;
  mainClassLevel: number;
  supportClassOption: string | null;
  supportClassOptionLevel: number | null;
}

type LadderCharacterRecordInsert = Omit<LadderCharacterRecord, "floorClearRecordIds">;

class LadderCharacterRecordsRepo extends DatabaseRepository<LadderCharacterRecordRow> {
  async insert(record: LadderCharacterRecordInsert, executor: Queryable = this.pgPool) {
    let supportClassColumn: string | null = null;
    let supportClassLevelColumn: number | null = null;
    if (record.supportClassOption !== undefined) {
      supportClassColumn = classToColumn(record.supportClassOption.combatantClass);
      supportClassLevelColumn = record.supportClassOption.level;
    }
    await executor.query(
      format(
        `INSERT INTO ${tableName}
           (id, party_record_id, controlling_player_id, name, main_class, main_class_level,
            support_class_option, support_class_option_level)
         VALUES (%L, %L, %L, %L, %L, %L, %L, %L);`,
        record.id,
        record.partyRecordId,
        record.controllingPlayerId,
        record.name,
        classToColumn(record.mainClass),
        record.mainClassLevel,
        supportClassColumn,
        supportClassLevelColumn
      )
    );
  }

  async updateClassLevels(
    id: LadderCharacterRecordId,
    mainClassLevel: number,
    supportClassOptionLevel: number | null,
    executor: Queryable = this.pgPool
  ) {
    await executor.query(
      format(
        `UPDATE ${tableName}
         SET main_class_level = %L, support_class_option_level = %L
         WHERE id = %L;`,
        mainClassLevel,
        supportClassOptionLevel,
        id
      )
    );
  }
}

function classToColumn(combatantClass: CombatantClass) {
  return COMBATANT_CLASS_NAME_STRINGS[combatantClass].toLowerCase();
}

export const ladderCharacterRecordsRepo = new LadderCharacterRecordsRepo(pgPool, tableName);
