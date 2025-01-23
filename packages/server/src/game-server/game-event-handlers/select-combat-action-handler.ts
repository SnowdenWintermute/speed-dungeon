import {
  CharacterAssociatedData,
  CombatActionComponent,
  CombatantProperties,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons.js";
import { CombatActionName } from "@speed-dungeon/common";

export default function selectCombatActionHandler(
  eventData: { characterId: string; combatActionNameOption: null | CombatActionName },
  characterAssociatedData: CharacterAssociatedData
) {
  const gameServer = getGameServer();
  const { combatActionNameOption } = eventData;

  const { character, game, party } = characterAssociatedData;
  let combatActionOption: null | CombatActionComponent = null;
  if (combatActionNameOption !== null) {
    const combatActionPropertiesResult = CombatantProperties.getCombatActionPropertiesIfOwned(
      character.combatantProperties,
      combatActionNameOption
    );
    if (combatActionPropertiesResult instanceof Error) return combatActionPropertiesResult;
    combatActionOption = combatActionPropertiesResult;
  }

  const newTargetsResult = SpeedDungeonGame.assignCharacterActionTargets(
    game,
    character.entityProperties.id,
    characterAssociatedData.player.username,
    combatActionOption
  );

  if (newTargetsResult instanceof Error) return newTargetsResult;

  character.combatantProperties.selectedCombatAction = combatActionOption;

  gameServer.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.CharacterSelectedCombatAction,
      character.entityProperties.id,
      combatActionOption
    );
}
