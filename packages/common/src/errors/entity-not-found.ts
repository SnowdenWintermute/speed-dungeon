import { EntityId } from "../primatives/index.js";

export class EntityNotFoundError extends Error {
  constructor(
    message: string,
    public entityId: EntityId
  ) {
    super(message);
    this.name = "EntityNotFoundError";
  }
}
