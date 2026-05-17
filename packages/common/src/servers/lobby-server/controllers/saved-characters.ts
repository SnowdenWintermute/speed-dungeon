import { Combatant } from "../../../combatants/index.js";
import { ERROR_MESSAGES } from "../../../errors/index.js";
import { GameStateUpdate, GameStateUpdateType } from "../../../packets/game-state-updates.js";
import { CharacterCreationPolicy } from "../../../character-creation/character-creation-policy.js";
import { CharacterLifecycleController } from "./character-lifecycle.js";
import { CHARACTER_LEVEL_LADDER, RankedLadderService } from "../../services/ranked-ladder.js";
import { UserSession } from "../../sessions/user-session.js";
import { CombatantClass } from "../../../combatants/combatant-class/classes.js";
import { CharacterSlotIndex, CombatantId, EntityName } from "../../../aliases.js";
import { LobbyExternalServices } from "../index.js";
import { MessageDispatchFactory } from "../../update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../../update-delivery/outbox.js";
import { SpeedDungeonProfile, SpeedDungeonProfileService } from "../../services/profiles.js";
import { CHARACTER_SLOT_SPACING, DEFAULT_ACCOUNT_CHARACTER_CAPACITY } from "../../../app-consts.js";
import { CharacterControlScheme, GameMode } from "../../../game-modes/index.js";
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
      gameMode: GameMode;
      controlScheme: CharacterControlScheme;
    }
  ) {
    const { gameMode, controlScheme } = data;
    session.requireAuthorized();
    const profile = await session.requireProfile(this.profileService);
    const characterSlots = await this.userGameDataPersistenceService.fetchSavedCharacterSlots(
      profile.id,
      gameMode,
      controlScheme
    );

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    // tell this session about their saved characters
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.SavedCharacterList,
      data: { characterSlots },
    });

    return outbox;
  }

  // TODO - should become dead code when we start to allow joining without a default character
  // and character management within the game lobby
  async requireDefaultSavedCharacterForProgressionGame(
    profile: SpeedDungeonProfile,
    controlScheme: CharacterControlScheme
  ) {
    const charactersResult = await this.userGameDataPersistenceService.fetchSavedCharacterSlots(
      profile.id,
      GameMode.Progression,
      controlScheme
    );

    // only let them create/join a progression game if they have a saved character
    if (Object.values(charactersResult).length === 0) {
      throw new Error(ERROR_MESSAGES.GAME.NO_SAVED_CHARACTERS);
    }

    // get the first living character slot
    let defaultSavedCharacter: { combatant: Combatant; pets: Combatant[] } | undefined = undefined;

    for (const character of Object.values(charactersResult)) {
      const deserialized = Combatant.fromSerialized(character.combatant);
      const deserializedPets = character.pets.map((pet) => Combatant.fromSerialized(pet));
      if (!deserialized.combatantProperties.isDead()) {
        defaultSavedCharacter = { combatant: deserialized, pets: deserializedPets };
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
    data: {
      name: EntityName;
      combatantClass: CombatantClass;
      slotIndex: CharacterSlotIndex;
      gameMode: GameMode;
      controlScheme: CharacterControlScheme;
    }
  ) {
    session.requireAuthorized();
    const profile = await session.requireProfile(this.profileService);
    const { name, combatantClass, slotIndex, gameMode, controlScheme } = data;
    // check if the slot is valid to put a new character in
    const slot = await this.userGameDataPersistenceService.requireEmptySlot(
      profile.id,
      slotIndex,
      gameMode,
      controlScheme
    );

    CharacterLifecycleController.requireValidCharacterNameLength(name);

    const { character: newCharacter, pets } = this.characterCreationPolicy.createCharacter(
      name,
      combatantClass,
      session.username
    );

    newCharacter.combatantProperties.transformProperties.autoSetHomePosition(
      DEFAULT_ACCOUNT_CHARACTER_CAPACITY,
      slotIndex,
      {
        onCenterLine: true,
        slotSpacingOverride: CHARACTER_SLOT_SPACING,
        reverseOrder: true,
      }
    );

    const serializedPets = pets.map((pet) => pet.toSerialized());
    await this.userGameDataPersistenceService.saveCharacterInSlot(
      slot,
      newCharacter,
      pets,
      session.taggedUserId.id
    );

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.SavedCharacter,
      data: {
        character: { combatant: newCharacter.toSerialized(), pets: serializedPets },
        slotIndex,
      },
    });

    return outbox;
  }

  async deleteSavedCharacterHandler(
    session: UserSession,
    data: { entityId: CombatantId; gameMode: GameMode; controlScheme: CharacterControlScheme }
  ) {
    const { entityId, gameMode, controlScheme } = data;

    session.requireAuthorized();

    const profile = await session.requireProfile(this.profileService);

    // delete the character only if they own it
    const slot = await this.userGameDataPersistenceService.requireSlotWithCharacterId(
      profile.id,
      entityId,
      gameMode,
      controlScheme
    );
    await this.userGameDataPersistenceService.deleteCharacterInSlot(entityId, slot);

    // remove them from ladder
    await this.rankedLadderService.removeEntry(CHARACTER_LEVEL_LADDER, entityId);

    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.updateDispatchFactory);
    outbox.pushToConnection(session.connectionId, {
      type: GameStateUpdateType.SavedCharacterDeleted,
      data: { entityId },
    });

    return outbox;
  }
}
