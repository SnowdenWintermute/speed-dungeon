import { EntityId } from "../primatives/index.js";
import { v4 as uuidv4 } from "uuid";

export class IdGenerator {
  constructor() {}
  generate(): EntityId {
    return uuidv4();
  }
}
