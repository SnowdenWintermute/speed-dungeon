import format from "pg-format";
import { pgPool } from "../../singletons/pg-pool.js";
import { RESOURCE_NAMES } from "../db-consts.js";
import { DatabaseRepository } from "./index.js";
import { Queryable } from "../wrapped-pool.js";
import {
  COMBATANT_CLASS_NAME_STRINGS,
  CombatantClass,
  CombatantId,
  IdentityProviderId,
  LadderCharacterRecord,
  MapUtils,
  PartyId,
  invariant,
  iterateNumericEnumKeyedRecord,
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
  async findRecordById(id: CombatantId): Promise<LadderCharacterRecord | undefined> {
    const row = await this.findById(id);
    if (row === undefined) {
      return undefined;
    }
    return rowToRecord(row);
  }

  async findRecordsByPartyIds(partyIds: PartyId[]): Promise<LadderCharacterRecord[]> {
    return (await this.findWhereIn("partyRecordId", partyIds)).map(rowToRecord);
  }

  async findRecordsByControllingPlayerId(id: IdentityProviderId): Promise<LadderCharacterRecord[]> {
    const rows = await this.find("controllingPlayerId", id);
    return (rows ?? []).map(rowToRecord);
  }

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
        classToColumn(record.mainClass.combatantClass),
        record.mainClass.level,
        supportClassColumn,
        supportClassLevelColumn
      )
    );
  }

  async updateClassLevels(
    id: CombatantId,
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

// built from classToColumn rather than from the name strings, so the two directions cannot drift
const CLASS_FROM_COLUMN = MapUtils.invert(
  new Map(
    iterateNumericEnumKeyedRecord(COMBATANT_CLASS_NAME_STRINGS).map(([combatantClass]) => [
      combatantClass,
      classToColumn(combatantClass),
    ])
  )
);

function classFromColumn(value: string): CombatantClass {
  const combatantClass = CLASS_FROM_COLUMN.get(value);
  invariant(combatantClass !== undefined, `unknown combatant class column from db: ${value}`);
  return combatantClass;
}

function rowToRecord(row: LadderCharacterRecordRow): LadderCharacterRecord {
  return {
    id: row.id as CombatantId,
    name: row.name,
    mainClass: {
      combatantClass: classFromColumn(row.mainClass),
      level: row.mainClassLevel,
    },
    supportClassOption:
      row.supportClassOption === null
        ? undefined
        : {
            combatantClass: classFromColumn(row.supportClassOption),
            level: row.supportClassOptionLevel ?? 0,
          },
    controllingPlayerId: row.controllingPlayerId as unknown as IdentityProviderId,
    partyRecordId: row.partyRecordId as PartyId,
  };
}

export const ladderCharacterRecordsRepo = new LadderCharacterRecordsRepo(pgPool, tableName);
