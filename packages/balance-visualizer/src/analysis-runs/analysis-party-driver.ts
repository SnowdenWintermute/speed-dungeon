import {
  AdventuringParty,
  AffixGenerator,
  DungeonExplorationManager,
  DungeonGenerationPolicy,
  EquipmentRandomizer,
  IdGeneratorRandom,
  ItemBuilder,
  LootGenerator,
  RandomDungeonGenerationPolicy,
  RandomNumberGenerationPolicyFactory,
  SpeedDungeonGame,
} from "@speed-dungeon/common";

export class AnalysisPartyDriver {
  private dungeonGenerationPolicy: DungeonGenerationPolicy;
  private idGenerator = new IdGeneratorRandom({ saveHistory: false });
  private rngPolicy = RandomNumberGenerationPolicyFactory.allRandomPolicy();
  private itemBuilder = new ItemBuilder(
    new EquipmentRandomizer(this.rngPolicy, new AffixGenerator(this.rngPolicy))
  );
  private dungeonExplorationManager: DungeonExplorationManager;
  private lootGenerator = new LootGenerator(this.itemBuilder, this.idGenerator, this.rngPolicy);

  constructor(
    private game: SpeedDungeonGame,
    private party: AdventuringParty
  ) {
    this.dungeonExplorationManager = party.dungeonExplorationManager;
    this.dungeonGenerationPolicy = new RandomDungeonGenerationPolicy(
      this.idGenerator,
      this.itemBuilder,
      this.rngPolicy
    );
  }

  get reachedEndOfFloor() {
    return !this.dungeonExplorationManager.unexploredRoomsExistOnCurrentFloor();
  }

  moveToNextRoom(options: { isDescending: boolean }) {
    if (this.reachedEndOfFloor) {
      this.dungeonExplorationManager.enterNewFloor(this.dungeonGenerationPolicy, true, options);
    }

    this.dungeonExplorationManager.enterNextRoom(
      this.game,
      this.dungeonGenerationPolicy,
      this.idGenerator
    );
  }

  descend() {
    this.dungeonExplorationManager.incrementCurrentFloor();
    this.dungeonExplorationManager.clearRoomsExploredOnCurrentFloorCount();
    this.dungeonExplorationManager.clearUnexploredRooms();
    this.moveToNextRoom({ isDescending: true });
  }

  clearCurrentRoom() {
    if (this.party.battleId === null) {
      return;
    }
    const battle = this.game.getExpectedBattle(this.party.battleId);
    battle.resolveBattle(this.lootGenerator, { alliesDefeated: false, opponentsDefeated: true });
  }
}
