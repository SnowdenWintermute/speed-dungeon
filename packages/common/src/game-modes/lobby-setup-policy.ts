import { AdventuringParty } from "../adventuring-party/index.js";
import { CombatantId, GameName, PartyName } from "../aliases.js";
import { SpeedDungeonGame } from "../game/index.js";
import { GameStateUpdate } from "../packets/game-state-updates.js";
import { AllowedResult } from "../primatives/index.js";
import { PartySetupController } from "../servers/lobby-server/controllers/party-setup.js";
import { SpeedDungeonProfileService } from "../servers/services/profiles.js";
import { SavedCharactersService } from "../servers/services/saved-characters.js";
import { UserSession } from "../servers/sessions/user-session.js";
import { MessageDispatchFactory } from "../servers/update-delivery/message-dispatch-factory.js";
import { MessageDispatchOutbox } from "../servers/update-delivery/outbox.js";
import { IdGenerator } from "../utility-classes/index.js";

export abstract class GameModeLobbySetupPolicy {
  constructor(
    protected profileService: SpeedDungeonProfileService,
    protected savedCharactersService: SavedCharactersService,
    protected idGenerator: IdGenerator,
    protected messageDispatchFactory: MessageDispatchFactory<GameStateUpdate>
  ) {}

  // required number of parties, each player controls at least one character
  // all ironman character players in contiuned ironman game have connected
  abstract modeSpecificStartRequirementsMet(game: SpeedDungeonGame): AllowedResult;
  // is user authenticated if required, if it is IM run were they in that run, does user have tournament ticked if required
  abstract userCanJoin(session: UserSession, game: SpeedDungeonGame): AllowedResult;
  // is user authenticated if required, if it is IM run were they in that run
  // does user have available slots if is IM run
  abstract userCanCreate(session: UserSession): AllowedResult;
  abstract canSelectStartingFloor(): AllowedResult; // is starting floor selectable in this mode (only for progression)
  abstract getMaxStartingFloor(game: SpeedDungeonGame): number;
  abstract onCreation(game: SpeedDungeonGame): void;
  // for Ironman, put them in default party and assign them to their characters
  // for Progression, put them in default party and select one of their default characters if they have one
  // for games where they need to create characters, send a message to prompt them to create characters
  abstract onJoin(
    session: UserSession,
    game: SpeedDungeonGame,
    partySetupController: PartySetupController
  ): Promise<MessageDispatchOutbox<GameStateUpdate> | undefined>;
  // read control scheme, if ironman/race they can't select must
  // create or be assigned to previously owned characters in a continued run
  abstract getSelectableCharacterIds(
    session: UserSession,
    game: SpeedDungeonGame
  ): Promise<CombatantId[]>;
  // if ironman mode and game is a loaded continue, this is false
  abstract userCanAddCharacterToParty(
    session: UserSession,
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): AllowedResult;

  protected getDefaultPartyName(gameName: GameName) {
    return `Delvers of ${gameName}` as PartyName;
  }

  protected createDefaultPartyInGame(game: SpeedDungeonGame) {
    const defaultPartyName = this.getDefaultPartyName(game.name);
    game.adventuringParties.set(
      defaultPartyName,
      AdventuringParty.createInitialized(this.idGenerator.generate(), defaultPartyName)
    );
    return defaultPartyName;
  }
}
