import { CombatantId } from "../../aliases.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { GameStateUpdate } from "../../packets/game-state-updates.js";
import { AllowedResult } from "../../primatives/index.js";
import { MessageDispatchOutbox } from "../../servers/update-delivery/outbox.js";
import { GameModeLobbySetupPolicy } from "../lobby-setup-policy.js";

export class UnrankedRaceModeGameLobbySetup extends GameModeLobbySetupPolicy {
  override modeSpecificStartRequirementsMet(): AllowedResult {
    return { allowed: true };
  }

  override userCanJoin(): AllowedResult {
    return { allowed: true };
  }

  override userCanCreate(): AllowedResult {
    return { allowed: true };
  }

  override canSelectStartingFloor(): AllowedResult {
    return { allowed: false, reason: ERROR_MESSAGES.GAME.MODE };
  }

  override getMaxStartingFloor(): number {
    return 1;
  }

  override onCreation() {
    return;
  }

  override async onJoin(): Promise<MessageDispatchOutbox<GameStateUpdate>> {
    const outbox = new MessageDispatchOutbox<GameStateUpdate>(this.messageDispatchFactory);
    return outbox;
  }

  override async getSelectableCharacterIds(): Promise<CombatantId[]> {
    return [];
  }

  override userCanAddCharacterToParty(): AllowedResult {
    return { allowed: true };
  }
}
