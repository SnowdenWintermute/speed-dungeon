import { AdventuringParty } from "../../adventuring-party/index.js";
import { CombatantId, GameName, PartyName } from "../../aliases.js";
import { MAX_PARTY_SIZE } from "../../app-consts.js";
import { Combatant } from "../../combatants/index.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { GameStateUpdate, GameStateUpdateType } from "../../packets/game-state-updates.js";
import { AllowedResult } from "../../primatives/index.js";
import { PartySetupController } from "../../servers/lobby-server/controllers/party-setup.js";
import {
  SpeedDungeonProfile,
  SpeedDungeonProfileService,
} from "../../servers/services/profiles.js";
import { SavedCharactersService } from "../../servers/services/saved-characters.js";
import { UserSession } from "../../servers/sessions/user-session.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { CombatantWithPets } from "../../types.js";
import { IdGenerator } from "../../utility-classes/index.js";
import { CharacterControlScheme, GameMode } from "../index.js";
import { GameModeLobbySetupPolicy } from "../lobby-setup-policy.js";

export class ProgressionGameLobbySetup implements GameModeLobbySetupPolicy {
  constructor(
    private profileService: SpeedDungeonProfileService,
    private savedCharactersService: SavedCharactersService,
    private idGenerator: IdGenerator
  ) {}
  modeSpecificStartRequirementsMet(): AllowedResult {
    return { allowed: true };
  }

  userCanJoin(session: UserSession, game: SpeedDungeonGame): AllowedResult {
    if (!session.isAuth()) {
      return { allowed: false, reason: ERROR_MESSAGES.AUTH.REQUIRED };
    }
    if (game.players.size >= MAX_PARTY_SIZE) {
      return { allowed: false, reason: ERROR_MESSAGES.GAME.IS_FULL };
    }
    return { allowed: true };
  }

  userCanCreate(session: UserSession): AllowedResult {
    if (session.isAuth()) {
      return { allowed: true };
    } else {
      return { allowed: false, reason: ERROR_MESSAGES.AUTH.REQUIRED };
    }
  }

  canSelectStartingFloor(): AllowedResult {
    return { allowed: true };
  }

  getMaxStartingFloor(game: SpeedDungeonGame): number {
    return game.maxStartingFloor;
  }

  onCreation(game: SpeedDungeonGame) {
    // progression games have only a single, automatically generated party
    this.createDefaultPartyInGame(game);
  }

  async onJoin(
    session: UserSession,
    game: SpeedDungeonGame,
    partySetupController: PartySetupController
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    // // put them in their party
    const defaultPartyName = this.getDefaultPartyName(game.name);
    const outbox = partySetupController.joinPartyHandler(session, defaultPartyName);

    // if have an eligible character, put the character in the party
    // @TODO - else prompt to create new character
    const profile = await session.requireProfile(this.profileService);
    const { mode, characterControlScheme } = game;
    const defaultSavedCharacter = await this.getDefaultSavedCharacterOption(
      profile,
      characterControlScheme,
      mode
    );
    const party = game.getExpectedParty(defaultPartyName);
    const player = game.getExpectedPlayer(session.username);
    if (defaultSavedCharacter) {
      game.addCharacterToParty(
        party,
        player,
        defaultSavedCharacter.combatant,
        defaultSavedCharacter.pets
      );
      outbox.pushToChannel(game.getChannelName(), {
        type: GameStateUpdateType.CharacterAddedToParty,
        data: {
          username: session.username,
          character: defaultSavedCharacter.combatant.toSerialized(),
          pets: defaultSavedCharacter.pets.map((pet) => pet.toSerialized()),
        },
      });
    }

    return outbox;
  }

  async getSelectableCharacterIds(
    session: UserSession,
    game: SpeedDungeonGame
  ): Promise<CombatantId[]> {
    const profile = await session.requireProfile(this.profileService);
    const { mode, characterControlScheme } = game;
    // check which living saved characters are allowed for this mode and control scheme
    throw new Error("Method not implemented.");
  }

  private getDefaultPartyName(gameName: GameName) {
    return `Delvers of ${gameName}` as PartyName;
  }

  private createDefaultPartyInGame(game: SpeedDungeonGame) {
    const defaultPartyName = this.getDefaultPartyName(game.name);
    game.adventuringParties.set(
      defaultPartyName,
      AdventuringParty.createInitialized(this.idGenerator.generate(), defaultPartyName)
    );
    return defaultPartyName;
  }

  userCanAddCharacterToParty(
    session: UserSession,
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): AllowedResult {
    return { allowed: true };
  }

  private async getDefaultSavedCharacterOption(
    profile: SpeedDungeonProfile,
    characterControlScheme: CharacterControlScheme,
    gameMode: GameMode
  ): Promise<CombatantWithPets | undefined> {
    // @TODO - check the game mode and characterControlScheme

    const charactersResult = await this.savedCharactersService.fetchSavedCharacters(profile.id);

    // get the first living character slot
    let defaultSavedCharacter: CombatantWithPets | undefined = undefined;

    for (const character of Object.values(charactersResult)) {
      const deserialized = Combatant.fromSerialized(character.combatant);
      const deserializedPets = character.pets.map((pet) => Combatant.fromSerialized(pet));
      if (!deserialized.combatantProperties.isDead()) {
        defaultSavedCharacter = { combatant: deserialized, pets: deserializedPets };
        break;
      }
    }

    return defaultSavedCharacter;
  }
}
