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

  moveToNextRoom() {
    this.dungeonExplorationManager.enterNextRoom(
      this.game,
      this.dungeonGenerationPolicy,
      this.idGenerator
    );
  }

  moveToNextFloor() {
    this.dungeonExplorationManager.enterNewFloor(this.dungeonGenerationPolicy, true, {
      isDescending: true,
    });
  }

  clearCurrentRoom() {
    if (this.party.battleId === null) {
      return;
    }
    const battle = this.game.getExpectedBattle(this.party.battleId);
    battle.resolveBattle(this.lootGenerator, { alliesDefeated: false, opponentsDefeated: true });
  }
}
