export type EntityId = number;
export * from "./hash-set";
export * from "./hash-map";

export class EntityProperties {
  constructor(
    public id: EntityId,
    public name: string
  ) {}
}
