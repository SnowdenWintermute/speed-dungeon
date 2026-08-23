import { AnalysisCharacterSpecification } from "@/analysis-subjects/analysis-character-specification";
import {
  AdventuringParty,
  AffixGenerator,
  CharacterControlScheme,
  CombatantId,
  DefaultCharacterCreationPolicy,
  EquipmentRandomizer,
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

  private initializePartyContext() {
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

    characterWithPets.combatant
      .getCombatantProperties()
      .classProgressionProperties.setSupportClass(spec.characterBuildSpec.supportClass, 0);

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

    const { game, party } = this.initializePartyContext();

    const analysisSpecsByCombatantId = new Map<CombatantId, AnalysisCharacterSpecification>();
    for (const spec of analysisSpecs) {
      const character = this.addCharacter(game, party, spec);
      analysisSpecsByCombatantId.set(character.getEntityId(), spec);
    }

    return { game, party, analysisSpecsByCombatantId };
  }
}
