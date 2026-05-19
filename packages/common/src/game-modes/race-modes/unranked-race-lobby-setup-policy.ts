import { CombatantId } from "../../aliases.js";
import { ERROR_MESSAGES } from "../../errors/index.js";
import { SpeedDungeonGame } from "../../game/index.js";
import { AllowedResult } from "../../primatives/index.js";
import { GameModeLobbySetupPolicy } from "../lobby-setup-policy.js";

export class UnrankedRaceModeLobbySetup extends GameModeLobbySetupPolicy {
  override async modeSpecificStartRequirementsMet(): Promise<AllowedResult> {
    return { allowed: true };
  }

  override async userCanJoin(): Promise<AllowedResult> {
    return { allowed: true };
  }

  override async userCanCreate(): Promise<AllowedResult> {
    return { allowed: true };
  }

  override async createGame(): Promise<SpeedDungeonGame> {
    throw new Error("tbd");
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
