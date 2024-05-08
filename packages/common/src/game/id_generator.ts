import { EntityId } from "../primatives";

export class IdGenerator {
  last_assigned_entity_id: EntityId = 0;
  constructor(){};

  getNextEntityId() {
    return this.last_assigned_entity_id += 1;
  }
}
