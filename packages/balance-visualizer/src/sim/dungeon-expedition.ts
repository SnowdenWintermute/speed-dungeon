import {
  AdventuringParty,
  Battle,
  CharacterControlScheme,
  Combatant,
  CombatantClass,
  CombatantId,
  Consumable,
  EntityName,
  Equipment,
  GameId,
  GameMode,
  GameName,
  PartyId,
  PartyWipes,
  SpeedDungeonGame,
  Username,
} from "@speed-dungeon/common";
import cloneDeep from "lodash.clonedeep";
import { GameServices } from "./game-services";
import { CharacterRoomSnapshot } from "./run-history";

const SIMULATED_PLAYER_NAME = "simulated-player" as Username;
const PARTY_ALWAYS_WINS: PartyWipes = { alliesDefeated: false, opponentsDefeated: true };

export interface EncounterLoot {
  equipment: Equipment[];
  consumables: Consumable[];
}

/** Walks a party down the dungeon by driving the same DungeonExplorationManager the game server
 * drives, so floors, palettes and room order come from real generation rather than a copy of it. */
export class DungeonExpedition {
  private readonly experienceEarned = new Map<CombatantId, number>();

  private constructor(
    private readonly services: GameServices,
    private readonly game: SpeedDungeonGame,
    private readonly party: AdventuringParty
  ) {}

  static begin(services: GameServices, combatantClasses: CombatantClass[]) {
    const { idGenerator, characterCreationPolicy } = services;

    const game = new SpeedDungeonGame(
      idGenerator.generate() as GameId,
      "balance-simulation" as GameName,
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

    return new DungeonExpedition(services, game, party);
  }

  getCurrentFloor() {
    return this.party.dungeonExplorationManager.getCurrentFloor();
  }

  getRoomNumberOnFloor() {
    return this.party.dungeonExplorationManager.getCurrentRoomNumber();
  }

  hasUnexploredRoomsOnCurrentFloor() {
    return this.party.dungeonExplorationManager.unexploredRoomsExistOnCurrentFloor();
  }

  monstersArePresent() {
    return this.party.combatantManager.monstersArePresent();
  }

  stockCurrentFloor() {
    const { dungeonGenerationPolicy } = this.services;
    const { dungeonExplorationManager } = this.party;
    const floorNumber = dungeonExplorationManager.getCurrentFloor();

    const { palette, boss } = dungeonGenerationPolicy.generateFloorPalette(floorNumber);
    dungeonExplorationManager.setCurrentFloorPalette(palette);
    dungeonExplorationManager.setCurrentFloorBoss(boss);
    dungeonExplorationManager.setUnexploredRoomTypes(
      dungeonGenerationPolicy.generateUnexploredRoomTypesOnFloor(floorNumber, boss !== null)
    );
  }

  enterNextRoom() {
    const { dungeonExplorationManager, combatantManager } = this.party;
    const roomType = dungeonExplorationManager.popNextUnexploredRoomType();

    const { room, monsters } = this.services.dungeonGenerationPolicy.generateDungeonRoom(
      dungeonExplorationManager.getCurrentFloor(),
      roomType,
      dungeonExplorationManager.getCurrentRoomNumber(),
      dungeonExplorationManager.getCurrentFloorPalette(),
      dungeonExplorationManager.getCurrentFloorBoss()
    );

    this.party.setCurrentRoom(room);
    for (const monster of monsters) {
      combatantManager.addCombatant(monster, this.game);
    }
    dungeonExplorationManager.incrementExploredRoomsTrackers();

    return roomType;
  }

  /** Part 1 assumes the party always wins, so an encounter resolves straight to victory. Loot
   * lands in the current room's inventory exactly as it does in a real battle. */
  clearCurrentEncounter(): EncounterLoot {
    const battleId = Battle.createInitialized(
      this.game,
      this.party,
      this.services.idGenerator.generate()
    );
    this.party.setBattleId(battleId);

    const { loot, experiencePointChanges } = this.party
      .requireBattle(this.game)
      .resolveBattle(this.services.lootGenerator, PARTY_ALWAYS_WINS);

    for (const [combatantId, change] of Object.entries(experiencePointChanges)) {
      const earnedSoFar = this.experienceEarned.get(combatantId) ?? 0;
      this.experienceEarned.set(combatantId, earnedSoFar + change);
    }

    this.party.removeCombatantsOnBattleEnd(this.game);

    return loot;
  }

  /** Mirrors the state changes of DungeonExplorationController.descendParty, minus the ones that
   * only exist to talk to clients or the game clock. */
  descend() {
    const { dungeonExplorationManager } = this.party;
    dungeonExplorationManager.incrementCurrentFloor();
    dungeonExplorationManager.clearRoomsExploredOnCurrentFloorCount();
    dungeonExplorationManager.clearUnexploredRooms();
  }

  getCharacters(): Combatant[] {
    return this.party.combatantManager.getPartyMemberCombatants();
  }

  snapshot(): CharacterRoomSnapshot[] {
    return this.getCharacters().map((character) => {
      const clone = cloneDeep(character);
      // what was kept in reserve is better recorded as shards gained than as retained objects
      clone.combatantProperties.inventory.deleteAllItems();

      const snapshot: CharacterRoomSnapshot = {
        combatant: clone,
        totalAttributes: character.getTotalAttributes(),
        experienceEarned: this.experienceEarned.get(character.getEntityId()) ?? 0,
      };

      return snapshot;
    });
  }
}
