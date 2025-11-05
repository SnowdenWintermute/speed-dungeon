import { CombatActionName, EntityId } from "@speed-dungeon/common";

export class TargetIndicator {
  constructor(
    public targetedBy: EntityId,
    public targetId: EntityId,
    public actionName: CombatActionName
  ) {}

  getKey() {
    return this.targetedBy + this.targetId;
  }
}
