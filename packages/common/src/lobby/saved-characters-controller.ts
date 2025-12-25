import { Combatant, CombatantClass } from "../combatants/index.js";
import { ERROR_MESSAGES } from "../errors/index.js";
import { GameStateUpdateType } from "../packets/game-state-updates.js";
import { CharacterCreator } from "./character-creation/index.js";
import { CharacterLifecycleController } from "./character-lifecycle-controller.js";
import { GameStateUpdateDispatchFactory } from "./game-state-update-dispatch-factory.js";
import { CHARACTER_LEVEL_LADDER, RankedLadderService } from "./ranked-ladder-service.js";
import { SavedCharactersService } from "./saved-character-service.js";
import { SessionAuthorizationManager } from "./session-authorization-manager.js";
import { GameStateUpdateDispatchOutbox } from "./update-dispatch-outbox.js";
import { AuthorizedSession, UserSession } from "./user-session.js";

export class SavedCharactersController {
  constructor(
    private readonly sessionAuthManager: SessionAuthorizationManager,
    private readonly updateDispatchFactory: GameStateUpdateDispatchFactory,
    private readonly savedCharactersService: SavedCharactersService,
    private readonly rankedLadderService: RankedLadderService,
    private readonly characterCreator: CharacterCreator
  ) {}

  async fetchSavedCharactersHandler(session: UserSession) {
    const authorizedSession = await this.sessionAuthManager.requireAuthorizedSession(
      session.connectionId
    );
    const characterSlots = await this.savedCharactersService.fetchSavedCharacters(
      authorizedSession.profile.id
    );

    const outbox = new GameStateUpdateDispatchOutbox(this.updateDispatchFactory);
    // tell this session about their saved characters
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.SavedCharacterList,
      data: { characterSlots },
    });

    return outbox;
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

    // check if the slot is valid to put a new character in
    const slot = await this.savedCharactersService.requireEmptySlot(profile.id, slotIndex);
    await this.savedCharactersService.saveCharacterInSlot(slot, newCharacter, pets, userId);

    const outbox = new GameStateUpdateDispatchOutbox(this.updateDispatchFactory);
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.SavedCharacter,
      data: {
        character: { combatant: newCharacter.getSerialized(), pets: serializedPets },
        slotIndex,
      },
    });

    return outbox;
  }

  async deleteSavedCharacterHandler(session: UserSession, data: { entityId: string }) {
    const { entityId } = data;
    const loggedInUser = await this.sessionAuthManager.requireAuthorizedSession(
      session.connectionId
    );
    const { profile } = loggedInUser;

    // delete the character only if they own it
    const slot = await this.savedCharactersService.requireSlotWithCharacterId(profile.id, entityId);
    await this.savedCharactersService.deleteCharacterInSlot(entityId, slot);

    // remove them from ladder
    await this.rankedLadderService.removeEntry(CHARACTER_LEVEL_LADDER, entityId);

    const outbox = new GameStateUpdateDispatchOutbox(this.updateDispatchFactory);
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.SavedCharacterDeleted,
      data: { entityId },
    });

    return outbox;
  }
}
