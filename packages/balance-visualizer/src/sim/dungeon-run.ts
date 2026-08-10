import {
  CombatantClass,
  Consumable,
  Equipment,
  IdGeneratorSequential,
  RandomNumberGenerationPolicyFactory,
} from "@speed-dungeon/common";
import { CharacterSpec } from "./character-spec";
import { DungeonExpedition } from "./dungeon-expedition";
import { GameServices } from "./game-services";
import { RoomVisit } from "./run-history";

export const SIMULATED_PARTY_CLASSES = [
  CombatantClass.Warrior,
  CombatantClass.Rogue,
  CombatantClass.Mage,
];

export class DungeonRun {
  private constructor(
    private readonly expedition: DungeonExpedition,
    private readonly deepestFloor: number
  ) {}

  static of(expedition: DungeonExpedition, deepestFloor: number) {
    return new DungeonRun(expedition, deepestFloor);
  }

  /** Fresh services per run, so nothing carries between runs but the code itself. Callers wanting a
   * scripted dungeon or fixed rolls build the expedition themselves and use `of`. */
  static random(characterSpecs: CharacterSpec[], deepestFloor: number) {
    const services = new GameServices(
      new IdGeneratorSequential({ saveHistory: false }),
      RandomNumberGenerationPolicyFactory.allRandomPolicy()
    );
    return DungeonRun.of(DungeonExpedition.begin(services, characterSpecs), deepestFloor);
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
