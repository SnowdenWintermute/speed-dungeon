import { MAX_CHARACTER_NAME_LENGTH } from "../app-consts.js";
import { CombatantClass } from "../combatants/combatant-class/classes.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { IdGenerator } from "../utility-classes/index.js";
import { GameStateUpdateGateway } from "./game-state-update-gateway.js";
import { LobbyState } from "./lobby-state.js";
import { SavedCharactersManager } from "./saved-characters-manager.js";
import { SessionAuthorizationManager } from "./session-authorization-manager.js";
import { UserSessionRegistry } from "./user-session-registry.js";
import { UserSession } from "./user-session.js";

export class CharacterLifecycleManager {
  constructor(
    private readonly lobbyState: LobbyState,
    private readonly updateGateway: GameStateUpdateGateway,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly savedCharactersManager: SavedCharactersManager,
    private readonly sessionAuthManager: SessionAuthorizationManager,
    private readonly idGenerator: IdGenerator
  ) {}

  private requireValidCharacterNameLength(name: string) {
    if (name.length > MAX_CHARACTER_NAME_LENGTH) {
      throw new Error(ERROR_MESSAGES.COMBATANT.MAX_NAME_LENGTH_EXCEEDED);
    }
  }

  createCharacterHandler(
    session: UserSession,
    data: { name: string; combatantClass: CombatantClass }
  ) {
    const game = session.getExpectedCurrentGame(this.lobbyState);
    const party = session.getExpectedCurrentParty(game);
    const { name, combatantClass } = data;

    this.requireValidCharacterNameLength(name);

    // const newCharacter = createCharacter(name, combatantClass, player.username);
    // if (newCharacter instanceof Error) return newCharacter;
    // const pets: Combatant[] = [];
    // const serializedPets = pets.map((pet) => pet.getSerialized());
    // game.addCharacterToParty(partyOption, player, newCharacter, pets);
    // const serialized = newCharacter.getSerialized();
    // getGameServer()
    //   .io.of("/")
    //   .in(game.name)
    //   .emit(ServerToClientEvent.CharacterAddedToParty, session.username, serialized, serializedPets);
  }

  private createTestPets() {
    // // const testPet = generateMonster(1, 1, MonsterType.Wolf);
    // // delete testPet.combatantProperties.threatManager;
    // // testPet.combatantProperties.controlledBy.controllerType = CombatantControllerType.PlayerPetAI;
    // // testPet.combatantProperties.classProgressionProperties.experiencePoints.changeExperience(81);
    // // testPet.combatantProperties.attributeProperties.changeUnspentPoints(10);
    // // const pets: Combatant[] = [testPet];
  }

  // private createPlayerCharacter(
  //   name: string,
  //   combatantClass: CombatantClass,
  //   controllingPlayerName: string
  // ) {
  //   const characterId = this.idGenerator.generate(`player controlled character: ${name}`);

  //   if (name === "") name = generateRandomCharacterName();

  //   const entityProperties = { id: characterId, name };
  //   const combatantProperties = new CombatantProperties(
  //     combatantClass,
  //     CombatantSpecies.Humanoid,
  //     null,
  //     new CombatantControlledBy(CombatantControllerType.Player, controllingPlayerName),
  //     Vector3.Zero()
  //   );

  //   const newCharacter = Combatant.createInitialized(entityProperties, combatantProperties);

  //   CharacterOutfitter.outfitNewCharacter(newCharacter);

  //   return newCharacter;
  // }
}
