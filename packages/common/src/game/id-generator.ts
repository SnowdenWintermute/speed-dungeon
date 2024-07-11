import { EntityId } from "../primatives";

export class IdGenerator {
  last_assigned_entity_id: number = 0;
  constructor() {}

  getNextEntityId(): EntityId {
    this.last_assigned_entity_id += 1;
    return this.last_assigned_entity_id.toString();
  }
}
