import {
  CharacterAssociatedData,
  CombatActionComponent,
  CombatantProperties,
  ServerToClientEvent,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons.js";
import { CombatActionName } from "@speed-dungeon/common";
import { TargetingCalculator } from "@speed-dungeon/common";

export function selectCombatActionHandler(
  eventData: { characterId: string; combatActionNameOption: null | CombatActionName },
  characterAssociatedData: CharacterAssociatedData
) {
  const gameServer = getGameServer();
  const { combatActionNameOption } = eventData;

  const { character, game, party, player } = characterAssociatedData;
  let combatActionOption: null | CombatActionComponent = null;
  if (combatActionNameOption !== null) {
    const combatActionPropertiesResult = CombatantProperties.getCombatActionPropertiesIfOwned(
      character.combatantProperties,
      combatActionNameOption
    );
    if (combatActionPropertiesResult instanceof Error) return combatActionPropertiesResult;
    combatActionOption = combatActionPropertiesResult;
  }

  if (combatActionOption === null) {
    character.combatantProperties.selectedCombatAction = null;
    character.combatantProperties.combatActionTarget = null;
  } else {
    const targetingCalculator = new TargetingCalculator(game, party, character, player);
    const filteredIdsResult =
      targetingCalculator.getFilteredPotentialTargetIdsForAction(combatActionOption);
    if (filteredIdsResult instanceof Error) return filteredIdsResult;
    const [allyIdsOption, opponentIdsOption] = filteredIdsResult;
    const newTargetsResult =
      targetingCalculator.getPreferredOrDefaultActionTargets(combatActionOption);

    if (newTargetsResult instanceof Error) return newTargetsResult;

    const newTargetPreferencesResult = targetingCalculator.getUpdatedTargetPreferences(
      combatActionOption,
      newTargetsResult,
      allyIdsOption,
      opponentIdsOption
    );
    if (newTargetPreferencesResult instanceof Error) return newTargetPreferencesResult;

    player.targetPreferences = newTargetPreferencesResult;
    character.combatantProperties.selectedCombatAction = combatActionOption.name;
    character.combatantProperties.combatActionTarget = newTargetsResult;
  }

  gameServer.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.CharacterSelectedCombatAction,
      character.entityProperties.id,
      combatActionNameOption
    );
}
