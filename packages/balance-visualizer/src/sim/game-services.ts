import {
  AffixGenerator,
  CharacterCreationPolicy,
  DefaultCharacterCreationPolicy,
  DungeonGenerationPolicy,
  EquipmentRandomizer,
  IdGenerator,
  ItemBuilder,
  LootGenerator,
  RandomDungeonGenerationPolicy,
  RandomNumberGenerationPolicy,
} from "@speed-dungeon/common";

export class GameServices {
  readonly itemBuilder: ItemBuilder;
  readonly lootGenerator: LootGenerator;
  readonly dungeonGenerationPolicy: DungeonGenerationPolicy;
  readonly characterCreationPolicy: CharacterCreationPolicy;

  constructor(
    readonly idGenerator: IdGenerator,
    readonly rngPolicy: RandomNumberGenerationPolicy
  ) {
    const equipmentRandomizer = new EquipmentRandomizer(rngPolicy, new AffixGenerator(rngPolicy));
    this.itemBuilder = new ItemBuilder(equipmentRandomizer);
    this.lootGenerator = new LootGenerator(this.itemBuilder, idGenerator, rngPolicy);
    this.dungeonGenerationPolicy = new RandomDungeonGenerationPolicy(
      idGenerator,
      this.itemBuilder,
      rngPolicy
    );
    this.characterCreationPolicy = new DefaultCharacterCreationPolicy(
      idGenerator,
      this.itemBuilder,
      rngPolicy
    );
  }
}
