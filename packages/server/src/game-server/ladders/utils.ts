import {
  ActionCommandPayload,
  ActionCommandType,
  GameMessage,
  GameMessageType,
  LadderDeathsUpdate,
  createLadderDeathsMessage,
} from "@speed-dungeon/common";

export function getTopRankedDeathMessagesActionCommandPayload(
  partyChannelToExclude: string,
  deathsAndRanks: LadderDeathsUpdate
): ActionCommandPayload {
  const messages = Object.entries(deathsAndRanks).map(([characterName, deathAndRank]) => {
    return new GameMessage(
      GameMessageType.LadderDeath,
      true,
      createLadderDeathsMessage(
        characterName,
        deathAndRank.owner,
        deathAndRank.level,
        deathAndRank.rank
      )
    );
  });

  return { type: ActionCommandType.GameMessages, messages, partyChannelToExclude };
}
