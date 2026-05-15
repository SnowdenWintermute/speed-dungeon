import { CombatantId } from "../../aliases.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { AllowedResult } from "../../primatives/index.js";
import { GameModeLobbySetupPolicy } from "../lobby-setup-policy.js";

export class UnrankedRaceModeLobbySetup extends GameModeLobbySetupPolicy {
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

  override async onJoin() {
    return undefined;
  }

  override async getSelectableCharacterIds(): Promise<CombatantId[]> {
    return [];
  }

  override userCanAddCharacterToParty(): AllowedResult {
    return { allowed: true };
  }
}
