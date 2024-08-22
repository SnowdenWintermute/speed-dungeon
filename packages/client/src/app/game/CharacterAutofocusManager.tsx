import { useGameStore } from "@/stores/game-store";
import React, { useEffect, useState } from "react";

/// Change the focused character under certain conditions like when their turn ends in combat while they are focused
export default function CharacterAutofocusManager() {
  const mutateGameState = useGameStore().mutateState;
  const clientHasGame = useGameStore().hasGame();
  const focusedCharacterId = useGameStore().focusedCharacterId;
  const activeCombatantResult = useGameStore().getActiveCombatant();
  const playerResult = useGameStore().getPlayer();
  const activeCombatantIdOption =
    activeCombatantResult instanceof Error
      ? null
      : activeCombatantResult?.entityProperties.id ?? null;
  const battleIdOption = useGameStore().getCurrentBattleId();

  const [previousRenderBattleId, setPreviousRenderBattleId] = useState<null | string>(null);
  const [previousActiveCombatantIdOption, setpreviousActiveCombatantIdOption] = useState<
    null | string
  >(null);

  // select first owned character at beginning of game

  useEffect(() => {
    if (playerResult instanceof Error) return console.error(playerResult);
    const ownedCharacterIds = playerResult.characterIds;
    if (ownedCharacterIds.length) {
      mutateGameState((gameState) => {
        gameState.focusedCharacterId = ownedCharacterIds[0];
      });
    }
  }, [clientHasGame]);

  useEffect(() => {
    let previousBattleId = null;
    mutateGameState((gameState) => {
      // if focusing active character and their turn ends, focus next active character
      const partyResult = gameState.getParty();
      if (partyResult instanceof Error) return console.error(partyResult.message);
      const party = partyResult;
      if (playerResult instanceof Error) return console.error(playerResult.message);
      const player = playerResult;
      previousBattleId = party.battleId;
      const clientIsViewingMenus = gameState.menuContext !== null;
      if (clientIsViewingMenus) return;

      if (previousActiveCombatantIdOption && activeCombatantIdOption) {
        const newActiveCombatantId = activeCombatantIdOption;
        const newlyActiveCombatantIsAPlayerCharacter =
          party.characterPositions.includes(newActiveCombatantId);
        const previouslyActiveCombatantIsAPlayerCharacter = party.characterPositions.includes(
          previousActiveCombatantIdOption
        );
        const clientWasFocusingPreviouslyActiveCombatant =
          focusedCharacterId === previousActiveCombatantIdOption;
        if (
          (newlyActiveCombatantIsAPlayerCharacter && clientWasFocusingPreviouslyActiveCombatant) ||
          !previouslyActiveCombatantIsAPlayerCharacter
        ) {
          gameState.focusedCharacterId = newActiveCombatantId;
        }
      }

      // if battle ended, focus first owned character
      const battleJustEnded = party.battleId === null && previousRenderBattleId !== null;
      const battleJustStarted = party.battleId !== null && previousRenderBattleId === null;
      if (battleJustEnded) {
        if (player.characterIds.length) gameState.focusedCharacterId = player.characterIds[0];
      }
      // if battle just started, focus active character if any (not enemy going first)
      else if (
        battleJustStarted &&
        activeCombatantIdOption !== null &&
        party.characterPositions.includes(activeCombatantIdOption)
      ) {
        gameState.focusedCharacterId = activeCombatantIdOption;
      }
    });
    setPreviousRenderBattleId(previousBattleId);
    setpreviousActiveCombatantIdOption(activeCombatantIdOption);
  }, [focusedCharacterId, activeCombatantIdOption, battleIdOption]);

  return <></>;
}
