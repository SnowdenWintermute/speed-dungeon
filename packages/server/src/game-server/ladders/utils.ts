import {
  ActionCommandPayload,
  ActionCommandType,
  GameMessageType,
  LadderDeathsUpdate,
  createLadderDeathsMessage,
} from "@speed-dungeon/common";

export function getTopRankedDeathMessagesActionCommandPayload(
  deathsAndRanks: LadderDeathsUpdate
): ActionCommandPayload {
  const messages = Object.entries(deathsAndRanks).map(([characterName, deathAndRank]) => {
    return {
      type: GameMessageType.LadderDeath,
      text: createLadderDeathsMessage(
        characterName,
        deathAndRank.owner,
        deathAndRank.level,
        deathAndRank.rank
      ),
    };
  });

  return { type: ActionCommandType.GameMessages, messages };
}
