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
  eventData: { characterId: string; combatActionOption: null | CombatActionName },
  characterAssociatedData: CharacterAssociatedData
) {
  const gameServer = getGameServer();
  const { combatActionOption } = eventData;

  const { character, game, party } = characterAssociatedData;
  let combatAction: null | CombatActionComponent = null;
  if (combatActionOption !== null) {
    const combatActionPropertiesResult = CombatantProperties.getCombatActionPropertiesIfOwned(
      character.combatantProperties,
      combatActionOption
    );
    if (combatActionPropertiesResult instanceof Error) return combatActionPropertiesResult;
    combatActionPropertiesOption = combatActionPropertiesResult;
  }

  const newTargetsResult = SpeedDungeonGame.assignCharacterActionTargets(
    game,
    character.entityProperties.id,
    characterAssociatedData.player.username,
    combatActionPropertiesOption
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
