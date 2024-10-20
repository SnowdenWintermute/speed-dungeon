import {
  AdventuringParty,
  ERROR_MESSAGES,
  SpeedDungeonGame,
  Combatant,
  SpeedDungeonPlayer,
} from "@speed-dungeon/common";
import { MiddlewareFn } from "./index.js";

export const prohibitIfDead: MiddlewareFn<
  { characterId: string; [key: string]: any },
  {
    character: Combatant;
    player: SpeedDungeonPlayer;
    game: SpeedDungeonGame;
    party: AdventuringParty;
  }
> = async (_socket, eventData, midlewareProvidedData, next) => {
  if (!midlewareProvidedData) throw new Error(ERROR_MESSAGES.EVENT_MIDDLEWARE.MISSING_DATA);

  if (midlewareProvidedData.character.combatantProperties.hitPoints <= 0)
    throw new Error(`${ERROR_MESSAGES.COMBATANT.IS_DEAD}`);

  next(eventData, midlewareProvidedData);
};
