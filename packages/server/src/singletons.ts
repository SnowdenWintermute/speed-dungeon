import WrappedPool from "./database/wrapped-pool.js";
export const pgPool = new WrappedPool();

import { v4 as uuidv4 } from "uuid";
import { EntityId } from "@speed-dungeon/common";

export class IdGenerator {
  constructor() {}
  generate(): EntityId {
    return uuidv4();
  }
}
export const idGenerator = new IdGenerator();
