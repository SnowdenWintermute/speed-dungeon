import { EntityId, PlayerAssociatedData } from "@speed-dungeon/common";
import { setAlert } from "@/app/components/alerts";
import { GameLogMessageService } from "@/mobx-stores/game-event-notifications/game-log-message-service";
import { playerAssociatedDataProvider } from "../combatant-associated-details-providers";

export function playerPostedItemLinkHandler(eventData: { username: string; itemId: EntityId }) {
  const { username, itemId } = eventData;

  playerAssociatedDataProvider(username, ({ partyOption }: PlayerAssociatedData) => {
    if (!partyOption) return;
    const itemResult = partyOption.getItem(itemId);
    if (itemResult instanceof Error) return setAlert(itemResult);
    GameLogMessageService.postItemLink(username, itemResult);
  });
}
