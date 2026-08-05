import { Consumable, Equipment } from "@speed-dungeon/common";
import { DungeonExpedition } from "./dungeon-expedition";
import { RoomVisit } from "./run-history";

export class DungeonRun {
  private constructor(
    private readonly expedition: DungeonExpedition,
    private readonly deepestFloor: number
  ) {}

  static of(expedition: DungeonExpedition, deepestFloor: number) {
    return new DungeonRun(expedition, deepestFloor);
  }

  walk(): RoomVisit[] {
    const visits: RoomVisit[] = [];
    let ordinal = 0;

    while (this.expedition.getCurrentFloor() <= this.deepestFloor) {
      this.expedition.stockCurrentFloor();

      while (this.expedition.hasUnexploredRoomsOnCurrentFloor()) {
        const roomType = this.expedition.enterNextRoom();

        let equipmentDropped: Equipment[] = [];
        let consumablesDropped: Consumable[] = [];
        if (this.expedition.monstersArePresent()) {
          const loot = this.expedition.clearCurrentEncounter();
          equipmentDropped = loot.equipment;
          consumablesDropped = loot.consumables;
        }

        ordinal += 1;
        visits.push({
          ordinal,
          floorNumber: this.expedition.getCurrentFloor(),
          roomNumberOnFloor: this.expedition.getRoomNumberOnFloor(),
          roomType,
          characters: this.expedition.snapshot(),
          equipmentDropped,
          consumablesDropped,
        });
      }

      this.expedition.descend();
    }

    return visits;
  }
}
