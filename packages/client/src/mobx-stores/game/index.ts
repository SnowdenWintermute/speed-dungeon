import { ActionUserContext, Combatant, EntityId, SpeedDungeonGame } from "@speed-dungeon/common";
import { CombatLogMessage } from "@/app/game/combat-log/combat-log-message";
import { TargetIndicator } from "@/app/3d-world/scene-entities/character-models/target-indicator-manager";
import { FloatingMessage } from "@/stores/game-store/floating-messages";
import { BabylonControlledCombatantData } from "@/stores/game-store/babylon-controlled-combatant-data";

export enum MenuContext {
  InventoryItems,
  Equipment,
  ItemsOnGround,
  AttributeAssignment,
}

export enum UiDisplayMode {
  Detailed,
  Simple,
  Sparse,
}

export const UI_DISPLAY_MODE_STRINGS: Record<UiDisplayMode, string> = {
  [UiDisplayMode.Detailed]: "Detailed",
  [UiDisplayMode.Simple]: "Simple",
  [UiDisplayMode.Sparse]: "Sparse",
};

export class AppStoreManager {
  game: null | SpeedDungeonGame = null;

  // Misc Game UI
  username: null | string = null;
  showItemsOnGround: boolean = true;
  targetingIndicators: TargetIndicator[] = [];
  combatantsWithPendingCraftActions: Partial<Record<EntityId, boolean>> = {};
  threatTableDetailedDisplayMode: UiDisplayMode = UiDisplayMode.Simple;

  authFormEmailField: string = "";

  // Combat log
  combatLogMessages: CombatLogMessage[] = [];

  // Babylon integration
  lastDebugMessageId: number = 0;
  combatantModelLoadingStates: { [combantatId: EntityId]: boolean } = {};
  babylonControlledCombatantDOMData: { [combatantId: string]: BabylonControlledCombatantData } = {};
  combatantFloatingMessages: { [combatantId: string]: FloatingMessage[] } = {};

  // Images
  itemThumbnails: { [itemId: string]: string } = {};
  combatantPortraits: { [combatantId: EntityId]: string } = {};

  hasGame: () => boolean = () => {
    throw new Error("not implementeted");
  };

  getFocusedCharacter: () => Error | Combatant = () => {
    throw new Error("not implementeted");
    // return getFocusedCharacter();
  };

  constructor() {}
}

export function getActionUserContext(): Error | ActionUserContext {
  throw new Error("not implemented");
  // const gameOption = gameState.game;

  // if (!gameOption) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
  // const game = gameOption;
  // if (!gameState.username) return new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
  // const partyOptionResult = getCurrentParty(gameState, gameState.username);
  // if (partyOptionResult instanceof Error) return partyOptionResult;
  // if (partyOptionResult === undefined) return new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
  // const party = partyOptionResult;
  // const combatantResult = SpeedDungeonGame.getCombatantById(game, combatantId);
  // if (combatantResult instanceof Error) return combatantResult;
  // return new ActionUserContext(game, party, combatantResult);
}
