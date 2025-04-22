import {
  COMBAT_ACTION_NAME_STRINGS,
  CharacterAssociatedData,
  CombatActionComponent,
  CombatantContext,
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

  const targetingCalculator = new TargetingCalculator(
    new CombatantContext(game, party, character),
    player
  );
  const initialTargetsResult =
    targetingCalculator.assignInitialCombatantActionTargets(combatActionOption);
  if (initialTargetsResult instanceof Error) return initialTargetsResult;

  character.combatantProperties.selectedCombatAction = combatActionNameOption;

  gameServer.io
    .in(getPartyChannelName(game.name, party.name))
    .emit(
      ServerToClientEvent.CharacterSelectedCombatAction,
      character.entityProperties.id,
      combatActionNameOption
    );
}
