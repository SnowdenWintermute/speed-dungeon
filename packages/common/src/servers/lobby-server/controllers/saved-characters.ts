import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { CharacterCreationPolicy } from "../../../character-creation/character-creation-policy.js";
import { CharacterLifecycleController } from "./character-lifecycle.js";
import { CHARACTER_LEVEL_LADDER, RankedLadderService } from "../../services/ranked-ladder.js";
import { UserSession } from "../../sessions/user-session.js";
import { CombatantClass } from "../../../combatants/combatant-class/classes.js";
import { CombatantId, EntityName } from "../../../aliases.js";
import { LobbyExternalServices } from "../index.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { SpeedDungeonProfileService } from "../../services/profiles.js";
import { DEFAULT_ACCOUNT_CHARACTER_CAPACITY } from "../../../app-consts.js";
import { CharacterControlScheme } from "../../../game-modes/index.js";
import { UserGameDataPersistenceService } from "../../services/user-game-data-persistence/index.js";

export class SavedCharactersController {
  private readonly userGameDataPersistenceService: UserGameDataPersistenceService;
  private readonly rankedLadderService: RankedLadderService;
  constructor(
    private readonly profileService: SpeedDungeonProfileService,
    private readonly updateDispatchFactory: MessageDispatchFactory<GameStateUpdate>,
    externalServices: LobbyExternalServices,
    private readonly characterCreationPolicy: CharacterCreationPolicy
  ) {
    this.userGameDataPersistenceService = externalServices.userGameDataPersistenceService;
    this.rankedLadderService = externalServices.rankedLadderService;
  }

  async fetchSavedCharactersHandler(
    session: UserSession,
    data: {
      controlScheme: CharacterControlScheme;
    }
  ) {
    const { controlScheme } = data;
    session.requireAuthorized();
    const profile = await session.requireProfile(this.profileService);
    const characters = await this.userGameDataPersistenceService.fetchSavedCharacters(
      profile.ownerId,
      controlScheme
    );

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.SavedCharacterList,
      data: { characterControlScheme: controlScheme, characters },
    });

    return outbox;
  }

  async createSavedCharacterHandler(
    session: UserSession,
    data: {
      name: EntityName;
      combatantClass: CombatantClass;
      controlScheme: CharacterControlScheme;
    }
  ) {
    session.requireAuthorized();
    const profile = await session.requireProfile(this.profileService);
    const { name, combatantClass, controlScheme } = data;

    await this.userGameDataPersistenceService.requireCapacityAvailable(
      profile.ownerId,
      controlScheme,
      DEFAULT_ACCOUNT_CHARACTER_CAPACITY
    );

    CharacterLifecycleController.requireValidCharacterNameLength(name);

    const { combatant: newCharacter, pets } = this.characterCreationPolicy.createCharacter(
      name,
      combatantClass,
      session.username
    );

    const serializedPets = pets.map((pet) => pet.toSerialized());
    await this.userGameDataPersistenceService.saveCharacter(
      newCharacter,
      pets,
      profile.ownerId,
      controlScheme
    );

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.SavedCharacter,
      data: {
        characterControlScheme: controlScheme,
        character: { combatant: newCharacter.toSerialized(), pets: serializedPets },
      },
    });

    return outbox;
  }

  async deleteSavedCharacterHandler(session: UserSession, data: { entityId: CombatantId }) {
    const { entityId } = data;

    session.requireAuthorized();

    const profile = await session.requireProfile(this.profileService);

    await this.userGameDataPersistenceService.requireOwnedCharacter(profile.ownerId, entityId);
    await this.userGameDataPersistenceService.deleteCharacter(entityId);

    await this.rankedLadderService.removeEntry(CHARACTER_LEVEL_LADDER, entityId);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.SavedCharacterDeleted,
      data: { entityId },
    });

    return outbox;
  }
}
