import {
  CharacterAssociatedData,
  CombatActionComponent,
  CombatantContext,
  CombatantProperties,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons/index.js";
import { CombatActionName } from "@speed-dungeon/common";
import { TargetingCalculator } from "@speed-dungeon/common";

export function selectCombatActionHandler(
  eventData: {
    characterId: string;
    combatActionNameOption: null | CombatActionName;
    combatActionLevel: null | number;
  },
  characterAssociatedData: CharacterAssociatedData
) {
  const gameServer = getGameServer();
  let { combatActionNameOption, combatActionLevel } = eventData;
  // @TODO - figure out if we want to allow initial action selection at a higher level than 1, and if
  // so how does that work if they can't afford it
  combatActionLevel = 1;

  const { character, game, party, player } = characterAssociatedData;
  let combatActionOption: null | CombatActionComponent = null;
  if (combatActionNameOption !== null && combatActionLevel !== null) {
    const combatActionPropertiesResult = CombatantProperties.getCombatActionPropertiesIfOwned(
      character.combatantProperties,
      combatActionNameOption,
      combatActionLevel
    );
    if (combatActionPropertiesResult instanceof Error) return combatActionPropertiesResult;
    combatActionOption = combatActionPropertiesResult;
  }

  character.combatantProperties.selectedCombatAction = combatActionNameOption;
  character.combatantProperties.selectedActionLevel = combatActionLevel;

  const targetingCalculator = new TargetingCalculator(
    new CombatantContext(game, party, character),
    player
  );
  const initialTargetsResult =
    targetingCalculator.assignInitialCombatantActionTargets(combatActionOption);
  if (initialTargetsResult instanceof Error) {
    character.combatantProperties.selectedCombatAction = null;
    character.combatantProperties.selectedActionLevel = null;
    return initialTargetsResult;
  }

  gameServer.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.CharacterSelectedCombatAction,
      character.entityProperties.id,
      combatActionNameOption,
      combatActionLevel
    );
}
