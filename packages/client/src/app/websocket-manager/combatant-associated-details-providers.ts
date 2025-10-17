import { CharacterAssociatedData, PlayerAssociatedData } from "@speed-dungeon/common";
import { setAlert } from "../components/alerts";
import { AppStore } from "@/mobx-stores/app-store";

export function characterAssociatedDataProvider(
  characterId: string,
  fn: (characterAssociatedData: CharacterAssociatedData) => void
) {
  const { game, party, combatant } =
    AppStore.get().gameStore.getExpectedCombatantContext(characterId);
  const player = AppStore.get().gameStore.getExpectedClientPlayer();
  try {
    fn({ game, character: combatant, party, player });
  } catch (err) {
    if (err instanceof Error) setAlert(err);
    else {
      throw new Error("unhandled exception");
    }
  }
}

export function playerAssociatedDataProvider(
  username: string,
  fn: (characterAssociatedData: PlayerAssociatedData) => void
) {
  const { gameStore } = AppStore.get();
  const game = gameStore.getExpectedGame();
  const party = gameStore.getExpectedParty();
  const player = gameStore.getExpectedPlayer(username);

  try {
    fn({ game, partyOption: party, player });
  } catch (err) {
    if (err instanceof Error) setAlert(err);
    else {
      throw new Error("unhandled exception");
    }
  }
}
