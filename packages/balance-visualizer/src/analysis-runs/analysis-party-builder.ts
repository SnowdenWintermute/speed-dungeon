import {
  AdventuringParty,
  AffixGenerator,
  CharacterControlScheme,
  CombatantClass,
  DefaultCharacterCreationPolicy,
  EntityName,
  EquipmentRandomizer,
  GameId,
  GameMode,
  GameName,
  IdGeneratorRandom,
  ItemBuilder,
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

  buildPartyInGame() {
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
    const playerName = "player name" as Username;
    const player = new SpeedDungeonPlayer(playerName, 0);
    game.addPlayer(player);

    const characterWithPets = this.characterCreationPolicy.createCharacter(
      "character 1" as EntityName,
      CombatantClass.Warrior,
      playerName
    );
    game.addCharacterToParty(party, player, characterWithPets.combatant, characterWithPets.pets);

    return { game, party };
  }
}
