import { useGameStore } from "@/stores/game-store";
import {
  AdventuringParty,
  EntityId,
  GameMessageType,
  PlayerAssociatedData,
} from "@speed-dungeon/common";
import { playerAssociatedDataProvider } from "../combatant-associated-details-providers";
import {
  COMBAT_LOG_MESSAGE_STYLES_BY_MESSAGE_TYPE,
  CombatLogMessage,
} from "@/app/game/combat-log/combat-log-message";
import { ItemLink } from "@/app/game/combat-log/item-link";
import { setAlert } from "@/app/components/alerts";

export function playerPostedItemLinkHandler(eventData: { username: string; itemId: EntityId }) {
  console.log("received", eventData);
  const { username, itemId } = eventData;

  let combatLogMessage: CombatLogMessage;

  playerAssociatedDataProvider(username, ({ partyOption }: PlayerAssociatedData) => {
    if (!partyOption) return;
    const itemResult = AdventuringParty.getItem(partyOption, itemId);
    if (itemResult instanceof Error) return setAlert(itemResult);

    combatLogMessage = new CombatLogMessage(
      (
        <div>
          {username} calls attention to <ItemLink item={itemResult} />
        </div>
      ),
      COMBAT_LOG_MESSAGE_STYLES_BY_MESSAGE_TYPE[GameMessageType.CraftingAction]
    );
  });

  useGameStore.getState().mutateState((state) => {
    state.combatLogMessages.push(combatLogMessage);
  });
}
