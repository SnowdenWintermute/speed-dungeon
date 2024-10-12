import format from "pg-format";
import WrappedPool from "../wrapped-pool.js";
import { toCamelCase, camelToSnakeCase } from "../utils.js";

export interface DataTypesForInsert {
  [columnName: string]: any;
}

export class DatabaseRepository<T> {
  constructor(
    public pgPool: WrappedPool,
    public tableName: string
  ) {}

  async findOne(field: keyof T, value: any): Promise<undefined | T> {
    const snakeCaseField = camelToSnakeCase(field.toString());
    const result = await this.pgPool.query(
      format(`SELECT * FROM ${this.tableName} WHERE %I = %L;`, snakeCaseField, value)
    );
    const { rows } = result;
    if (rows[0]) return toCamelCase(rows)[0] as unknown as T;
    return undefined;
  }

  async findById(id: string): Promise<undefined | T> {
    const result = await this.pgPool.query(
      format(`SELECT * FROM ${this.tableName} WHERE id = %L;`, id)
    );
    const { rows } = result;
    if (rows[0]) return toCamelCase(rows)[0] as unknown as T;
    return undefined;
  }

  async delete(id: number | string) {
    const { rows } = await this.pgPool.query(
      format(`DELETE FROM ${this.tableName} WHERE id = %L RETURNING *;`, id)
    );
    if (rows[0]) return toCamelCase(rows)[0] as unknown as T;
    return undefined;
  }

  async count() {
    const { rows } = await this.pgPool.query(`SELECT COUNT(*) FROM ${this.tableName};`);
    return parseInt(rows[0].count, 10);
  }
}
