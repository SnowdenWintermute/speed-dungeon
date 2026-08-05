import {
  AdventuringParty,
  applyExperiencePointChanges,
  CharacterControlScheme,
  Combatant,
  CombatantClass,
  GameId,
  GameMode,
  generateExperiencePoints,
  PartyId,
  SpeedDungeonGame,
  Username,
} from "@speed-dungeon/common";
import { GameServices } from "./game-services";
import { CharacterRoomSnapshot } from "./run-history";

const SIMULATED_PLAYER_NAME = "simulated-player" as Username;

export class RunParty {
  private constructor(
    private readonly game: SpeedDungeonGame,
    private readonly party: AdventuringParty
  ) {}

  static assemble(services: GameServices, combatantClasses: CombatantClass[]) {
    const { idGenerator, characterCreationPolicy } = services;

    const game = new SpeedDungeonGame(
      idGenerator.generate() as GameId,
      "balance-simulation",
      GameMode.Progression,
      CharacterControlScheme.Freelancer
    );

    const party = AdventuringParty.createInitialized(
      idGenerator.generate() as PartyId,
      "simulated-party"
    );
    game.addParty(party);

    for (const combatantClass of combatantClasses) {
      const { combatant } = characterCreationPolicy.createCharacter(
        "" as EntityName,
        combatantClass,
        SIMULATED_PLAYER_NAME
      );
      party.combatantManager.addCombatant(combatant, game);
    }

    return new RunParty(game, party);
  }

  getCharacters(): Combatant[] {
    return this.party.combatantManager.getPartyMemberCombatants();
  }

  /** Part 1 assumes every fight is won without losses, so clearing an encounter is only its
   * experience award. */
  clearEncounter(monsters: Combatant[]) {
    for (const monster of monsters) {
      this.party.combatantManager.addCombatant(monster, this.game);
    }

    applyExperiencePointChanges(this.party, generateExperiencePoints(this.party));

    for (const character of this.getCharacters()) {
      character.combatantProperties.classProgressionProperties.awardLevelups();
    }

    this.party.combatantManager.removeDungeonControlledCombatants(this.game);
  }

  snapshot(): CharacterRoomSnapshot[] {
    return this.getCharacters().map((character) => {
      const { classProgressionProperties, attributeProperties } = character.combatantProperties;
      return {
        characterName: character.getName(),
        combatantClass: classProgressionProperties.getMainClass().combatantClass,
        level: classProgressionProperties.getMainClass().level,
        experiencePoints: classProgressionProperties.experiencePoints.getCurrent(),
        unspentAttributePoints: attributeProperties.getUnspentPoints(),
      };
    });
  }
}
