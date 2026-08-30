import { AnalysisCharacterSpecification } from "../analysis-subjects/analysis-character-specification.ts";
import {
  AdventuringParty,
  AffixGenerator,
  CharacterControlScheme,
  Combatant,
  CombatantId,
  DefaultCharacterCreationPolicy,
  EquipmentSlotId,
  EquipmentRandomizer,
  EquipmentType,
  GameId,
  GameMode,
  GameName,
  IdGeneratorRandom,
  invariant,
  ItemBuilder,
  MAX_PARTY_SIZE,
  PartyId,
  PartyName,
  RandomNumberGenerationPolicyFactory,
  SpeedDungeonGame,
  SpeedDungeonPlayer,
  Username,
} from "@speed-dungeon/common";

export class AnalysisPartyBuilder {
  private idGenerator = new IdGeneratorRandom({ saveHistory: false });
  private rngPolicy = RandomNumberGenerationPolicyFactory.allRandomPolicy();
  private itemBuilder = new ItemBuilder(
    new EquipmentRandomizer(this.rngPolicy, new AffixGenerator(this.rngPolicy))
  );
  private characterCreationPolicy = new DefaultCharacterCreationPolicy(
    this.idGenerator,
    this.itemBuilder,
    this.rngPolicy
  );

  private static playerName = "player name" as Username;

  private createGameAndParty() {
    const game = new SpeedDungeonGame(
      "game id" as GameId,
      "game name" as GameName,
      GameMode.UnrankedRace,
      CharacterControlScheme.Captain
    );
    const party = AdventuringParty.createInitialized(
      "party id" as PartyId,
      "party name" as PartyName
    );

    const player = new SpeedDungeonPlayer(AnalysisPartyBuilder.playerName, 0);
    game.addPlayer(player);

    return { game, party };
  }

  private requirePlayer(game: SpeedDungeonGame) {
    return game.getExpectedPlayer(AnalysisPartyBuilder.playerName);
  }

  /**
   * The creation policy dresses a character for its class, not for the build its spec asks for, so a
   * warrior arrives holding a shield whatever it specializes in. The solver would never hand it one,
   * and nothing displaces a starting item a goal has no reason to replace — a two handed build would
   * report that shield's armor class for the whole run. Starting weapons are left on: what a build
   * does before its own weapon drops is a real measurement.
   */
  private static unequipShieldsTheBuildWouldNotUse(
    combatant: Combatant,
    spec: AnalysisCharacterSpecification
  ) {
    const { equipment } = combatant.getCombatantProperties();

    const slotIdsToUnequip: EquipmentSlotId[] = [];
    for (const [slotId, slot] of equipment.getAllActiveSlots()) {
      const equipped = slot.equipmentInSlot;
      if (equipped === null) {
        continue;
      }
      const { equipmentType } = equipped.equipmentBaseItemProperties;
      if (equipmentType !== EquipmentType.Shield) {
        continue;
      }
      if (!spec.combatantWouldConsiderEquipmentTypeInSlot(equipmentType, slotId)) {
        slotIdsToUnequip.push(slotId);
      }
    }

    equipment.unequipSlots(slotIdsToUnequip);
  }

  private addCharacter(
    game: SpeedDungeonGame,
    party: AdventuringParty,
    spec: AnalysisCharacterSpecification
  ) {
    const characterWithPets = this.characterCreationPolicy.createCharacter(
      spec.characterName,
      spec.characterBuildSpec.mainClass,
      AnalysisPartyBuilder.playerName
    );

    // an analysis subject starts with only what its spec asks for. the creation policy hands out
    // playtesting items, and the equipment solver drops every carried item into the room, so
    // anything left here would be scored and reported as loot the run never generated
    AnalysisPartyBuilder.unequipShieldsTheBuildWouldNotUse(characterWithPets.combatant, spec);
    characterWithPets.combatant.getCombatantProperties().inventory.deleteAllItems();

    const { supportClass } = spec.characterBuildSpec;
    if (supportClass !== null) {
      characterWithPets.combatant
        .getCombatantProperties()
        .classProgressionProperties.setSupportClass(supportClass, 0);
    }

    game.addCharacterToParty(
      party,
      this.requirePlayer(game),
      characterWithPets.combatant,
      characterWithPets.pets
    );

    return characterWithPets.combatant;
  }

  build(analysisSpecs: AnalysisCharacterSpecification[]) {
    invariant(
      analysisSpecs.length > 0 && analysisSpecs.length <= MAX_PARTY_SIZE,
      "must provide a list of character specifications greater than zero and less than MAX_PARTY_SIZE"
    );

    const { game, party } = this.createGameAndParty();

    const analysisSpecsByCombatantId = new Map<CombatantId, AnalysisCharacterSpecification>();
    for (const spec of analysisSpecs) {
      const character = this.addCharacter(game, party, spec);
      analysisSpecsByCombatantId.set(character.getEntityId(), spec);
    }

    return { game, party, analysisSpecsByCombatantId };
  }
}
