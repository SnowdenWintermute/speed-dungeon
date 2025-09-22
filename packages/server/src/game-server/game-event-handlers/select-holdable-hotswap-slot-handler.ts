import SocketIO from "socket.io";
import {
  AdventuringParty,
  CharacterAssociatedData,
  ClientToServerEventTypes,
  CombatActionExecutionIntent,
  CombatActionName,
  CombatActionTargetType,
  CombatantEquipment,
  ERROR_MESSAGES,
  HOTSWAP_SLOT_SELECTION_ACTION_POINT_COST,
  ServerToClientEvent,
  ServerToClientEventTypes,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons/index.js";
import { changeSelectedHotswapSlot } from "@speed-dungeon/common";
import { executeActionAndSendReplayResult } from "./character-uses-selected-combat-action-handler/index.js";

export default function selectHoldableHotswapSlotHandler(
  eventData: { characterId: string; slotIndex: number },
  characterAssociatedData: CharacterAssociatedData,
  _socket?: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  const { game, party, character } = characterAssociatedData;
  const { combatantProperties } = character;

  const battleOption = AdventuringParty.getBattleOption(party, game);

  if (battleOption) {
    const isCombatantTurn = battleOption.turnOrderManager.combatantIsFirstInTurnOrder(
      character.entityProperties.id
    );
    if (!isCombatantTurn) return new Error(ERROR_MESSAGES.COMBATANT.NOT_ACTIVE);
    if (combatantProperties.actionPoints < HOTSWAP_SLOT_SELECTION_ACTION_POINT_COST)
      return new Error(ERROR_MESSAGES.COMBAT_ACTIONS.INSUFFICIENT_RESOURCES);
  }

  const gameServer = getGameServer();
  const { slotIndex } = eventData;

  const { equipment } = character.combatantProperties;

  if (slotIndex >= CombatantEquipment.getHoldableHotswapSlots(equipment).length)
    return new Error(ERROR_MESSAGES.EQUIPMENT.SELECTED_SLOT_OUT_OF_BOUNDS);

  changeSelectedHotswapSlot(character.combatantProperties, slotIndex);

  const partyChannelName = getPartyChannelName(game.name, party.name);
  gameServer.io
    .to(partyChannelName)
    .emit(
      ServerToClientEvent.CharacterSelectedHoldableHotswapSlot,
      character.entityProperties.id,
      slotIndex
    );

  if (battleOption) {
    executeActionAndSendReplayResult(
      characterAssociatedData,
      new CombatActionExecutionIntent(CombatActionName.PayActionPoint, 1, {
        type: CombatActionTargetType.Single,
        targetId: eventData.characterId,
      }),
      false
    );
  }
}
