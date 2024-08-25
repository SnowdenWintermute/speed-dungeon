import {
  CharacterAssociatedData,
  CombatAction,
  CombatActionProperties,
  CombatantProperties,
  ServerToClientEvent,
  SpeedDungeonGame,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { BrowserTabSession } from "../socket-connection-metadata";
import { GameServer } from "..";

export default function selectCombatActionHandler(
  this: GameServer,
  browserTabSession: BrowserTabSession,
  characterAssociatedData: CharacterAssociatedData,
  combatActionOption: null | CombatAction
) {
  const { character, game, party } = characterAssociatedData;
  let combatActionPropertiesOption: null | CombatActionProperties = null;
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
    browserTabSession.username,
    combatActionPropertiesOption
  );

  if (newTargetsResult instanceof Error) return newTargetsResult;

  character.combatantProperties.selectedCombatAction = combatActionOption;

  this.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.CharacterSelectedCombatAction,
      character.entityProperties.id,
      combatActionOption
    );
}
