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
  modeSpecificStartRequirementsMet(game: SpeedDungeonGame): AllowedResult {
    throw new Error("Method not implemented.");
  }
  userCanJoin(session: UserSession, game: SpeedDungeonGame): AllowedResult {
    throw new Error("Method not implemented.");
  }
  userCanCreate(session: UserSession): AllowedResult {
    throw new Error("Method not implemented.");
  }
  canSelectStartingFloor(): AllowedResult {
    throw new Error("Method not implemented.");
  }
  getMaxStartingFloor(game: SpeedDungeonGame): number {
    throw new Error("Method not implemented.");
  }
  onCreation(game: SpeedDungeonGame): void {
    throw new Error("Method not implemented.");
  }
  onJoin(
    session: UserSession,
    game: SpeedDungeonGame,
    partySetupController: PartySetupController
  ): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    throw new Error("Method not implemented.");
  }

  userCanAddCharacterToParty(
    session: UserSession,
    game: SpeedDungeonGame,
    party: AdventuringParty
  ): AllowedResult {
    // if this is a continuing ironman run, false
    throw new Error("Method not implemented.");
  }

  getSelectableCharacterIds(session: UserSession, game: SpeedDungeonGame): Promise<CombatantId[]> {
    throw new Error("Method not implemented.");
  }
}
