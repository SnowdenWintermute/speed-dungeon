import {
  AdventuringParty,
  Battle,
  CharacterControlScheme,
  Combatant,
  CombatantClass,
  ClassProgressionProperties,
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
import { CharacterSpec } from "./character-spec";

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
    private readonly party: AdventuringParty,
    private readonly supportClasses: Map<CombatantId, CombatantClass>
  ) {}

  static begin(services: GameServices, characterSpecs: CharacterSpec[]) {
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

    const supportClasses = new Map<CombatantId, CombatantClass>();

    for (const { mainClass, supportClass } of characterSpecs) {
      const { combatant } = characterCreationPolicy.createCharacter(
        "" as EntityName,
        mainClass,
        SIMULATED_PLAYER_NAME
      );
      party.combatantManager.addCombatant(combatant, game);

      if (supportClass !== null) {
        supportClasses.set(combatant.getEntityId(), supportClass);
      }
    }

    return new DungeonExpedition(services, game, party, supportClasses);
  }

  // incremented rather than set outright: incrementSupportClassLevel is what awards
  // ATTRIBUTE_POINTS_AWARDED_PER_SUPPORT_CLASS_LEVEL, and setSupportClass would leave a character
  // with the class attributes but none of the points
  private grantSupportClassLevels() {
    for (const character of this.getCharacters()) {
      const supportClass = this.supportClasses.get(character.getEntityId());
      if (supportClass === undefined) {
        continue;
      }

      const { classProgressionProperties } = character.combatantProperties;
      const target = ClassProgressionProperties.maxSupportClassLevel(
        classProgressionProperties.getMainClass().level
      );

      while ((classProgressionProperties.getSupportClassOption()?.level ?? 0) < target) {
        classProgressionProperties.incrementSupportClassLevel(supportClass);
      }
    }
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

    // driven from the party rather than Object.entries, which widens the branded CombatantId key
    // back to a string. only party members are ever read back out of this
    for (const character of this.getCharacters()) {
      const combatantId = character.getEntityId();
      const change = experiencePointChanges[combatantId] ?? 0;
      const earnedSoFar = this.experienceEarned.get(combatantId) ?? 0;
      this.experienceEarned.set(combatantId, earnedSoFar + change);
    }

    this.grantSupportClassLevels();
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

  /** The inventory is set aside rather than copied and then dropped. What is kept in reserve is
   * better recorded as shards gained than as retained objects, so no snapshot ever wanted it — but
   * cloning it first meant every room paid to copy an inventory that grows all run, which is a cost
   * that climbs with depth rather than staying flat. Emptying the array in place keeps the same
   * Inventory instance, so nothing loses its link to the combatant. */
  snapshot(): CharacterRoomSnapshot[] {
    return this.getCharacters().map((character) => {
      const { inventory } = character.combatantProperties;
      const setAside = inventory.getItems().map((item) => item.getEntityId());
      const removed = setAside.map((itemId) => inventory.removeItem(itemId));

      const clone = cloneDeep(character);

      for (const item of removed) {
        if (!(item instanceof Error)) {
          inventory.insertItem(item);
        }
      }

      return {
        combatant: clone,
        totalAttributes: character.getTotalAttributes(),
        experienceEarned: this.experienceEarned.get(character.getEntityId()) ?? 0,
      };
    });
  }
}
