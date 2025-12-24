import { Combatant, CombatantClass } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { GameStateUpdateType } from "../packets/game-state-updates.js";
import { CharacterCreator } from "./character-creation/index.js";
import { CharacterLifecycleController } from "./character-lifecycle-controller.js";
import { GameStateUpdateGateway } from "./game-state-update-gateway.js";
import { SavedCharactersService } from "./saved-character-service.js";
import { SessionAuthorizationManager } from "./session-authorization-manager.js";
import { UserSessionRegistry } from "./user-session-registry.js";
import { AuthorizedSession, UserSession } from "./user-session.js";

export class SavedCharactersController {
  constructor(
    private readonly sessionAuthManager: SessionAuthorizationManager,
    private readonly userSessionRegistry: UserSessionRegistry,
    private readonly updateGateway: GameStateUpdateGateway,
    private readonly savedCharactersService: SavedCharactersService,
    private readonly characterCreator: CharacterCreator
  ) {}

  async fetchSavedCharactersHandler(session: UserSession) {
    const authorizedSession = await this.sessionAuthManager.requireAuthorizedSession(
      session.connectionId
    );
    const charactersResult = await this.savedCharactersService.fetchSavedCharacters(
      authorizedSession.profile.id
    );

    // tell this session about their saved characters
    this.updateGateway.submitToConnection(session.connectionId, {
      type: GameStateUpdateType.SavedCharacterList,
      data: { characterSlots: charactersResult },
    });
  }

  async getDefaultSavedCharacterForProgressionGame(authorizedSession: AuthorizedSession) {
    const charactersResult = await this.savedCharactersService.fetchSavedCharacters(
      authorizedSession.profile.id
    );

    // only let them create/join a progression game if they have a saved character
    if (Object.values(charactersResult).length === 0) {
      throw new Error(ERROR_MESSAGES.GAME.NO_SAVED_CHARACTERS);
    }

    // get the first living character slot
    let defaultSavedCharacter: { combatant: Combatant; pets: Combatant[] } | undefined = undefined;

    for (const character of Object.values(charactersResult)) {
      if (!character.combatant.combatantProperties.isDead()) {
        defaultSavedCharacter = character;
        break;
      }
    }

    if (defaultSavedCharacter === undefined) {
      throw new Error(ERROR_MESSAGES.USER.NO_LIVING_CHARACTERS);
    }

    return defaultSavedCharacter;
  }

  async createSavedCharacterHandler(
    session: UserSession,
    data: { name: string; combatantClass: CombatantClass; slotIndex: number }
  ) {
    const loggedInUser = await this.sessionAuthManager.requireAuthorizedSession(
      session.connectionId
    );
    const { userId, profile } = loggedInUser;

    const { name, combatantClass, slotIndex } = data;

    CharacterLifecycleController.requireValidCharacterNameLength(name);

    const newCharacter = this.characterCreator.createCharacter(
      name,
      combatantClass,
      session.username
    );

    const pets: Combatant[] = [];
    const serializedPets = pets.map((pet) => pet.getSerialized());

    // CHECK IF THE SLOT IS VALID TO PUT A NEW CHARACTER IN

    // const slot = await characterSlotsRepo.getSlot(profile.id, slotNumber);

    // if (!slot) {
    //   throw new Error("Character slot missing");
    // }

    // if (slot.characterId !== null) {
    //   throw new Error(ERROR_MESSAGES.USER.CHARACTER_SLOT_FULL);
    // }

    // PERSIST THE CHARACTER

    // await playerCharactersRepo.insert(newCharacter, pets, userId);

    // UPDATE THE SLOT'S REFERENCE TO THE NEWLY PERSISTED CHARACTER

    // slot.characterId = newCharacter.entityProperties.id;
    // await characterSlotsRepo.update(slot);

    // UPDATE THE LADDER RANKINGS

    // await valkeyManager.context.zAdd(CHARACTER_LEVEL_LADDER, [
    //   {
    //     value: newCharacter.entityProperties.id,
    //     score: newCharacter.combatantProperties.classProgressionProperties.getMainClass().level,
    //   },
    // ]);

    this.updateGateway.submitToConnection(session.connectionId, {
      type: GameStateUpdateType.SavedCharacter,
      data: {
        character: { combatant: newCharacter.getSerialized(), pets: serializedPets },
        slotIndex,
      },
    });
  }
}
