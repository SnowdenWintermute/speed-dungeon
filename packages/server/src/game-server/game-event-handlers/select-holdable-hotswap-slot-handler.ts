import SocketIO from "socket.io";
import {
  AdventuringParty,
  Battle,
  CharacterAssociatedData,
  ClientToServerEventTypes,
  CombatantEquipment,
  ERROR_MESSAGES,
  ServerToClientEvent,
  ServerToClientEventTypes,
  getPartyChannelName,
} from "@speed-dungeon/common";
import { getGameServer } from "../../singletons.js";
import { changeSelectedHotswapSlot } from "@speed-dungeon/common";

export default function selectHoldableHotswapSlotHandler(
  eventData: { characterId: string; slotIndex: number },
  characterAssociatedData: CharacterAssociatedData,
  _socket?: SocketIO.Socket<ClientToServerEventTypes, ServerToClientEventTypes>
) {
  const { game, party, character } = characterAssociatedData;

  if (party.battleId) {
    const battleOption = AdventuringParty.getBattleOption(party, game);
    if (battleOption) {
      const isCombatantTurn = Battle.combatantIsFirstInTurnOrder(
        battleOption,
        character.entityProperties.id
      );
      if (!isCombatantTurn) return new Error(ERROR_MESSAGES.COMBATANT.NOT_ACTIVE);
    }
  }

  const gameServer = getGameServer();
  const { slotIndex } = eventData;

  if (slotIndex >= CombatantEquipment.getHoldableHotswapSlots(character.combatantProperties).length)
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
}
