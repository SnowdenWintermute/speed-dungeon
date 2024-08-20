import { GameState } from ".";

export class BabylonControlledCombatantData {
  debugMessages: CombatantModelDebugMessage[] = [];
  constructor() {}
}

export class CombatantModelDebugMessage {
  constructor(
    public text: string,
    public id: string,
    public displayTime: number
  ) {}
}

export function setDebugMessage(
  mutateGameState: (fn: (state: GameState) => void) => void,
  combatantId: string,
  message: string,
  displayTime: number
) {
  mutateGameState((gameState) => {
    let newMessage = new CombatantModelDebugMessage(
      message,
      gameState.lastDebugMessageId.toString(),
      displayTime
    );
    if (!gameState.babylonControlledCombatantDOMData[combatantId]) {
      gameState.babylonControlledCombatantDOMData[combatantId] =
        new BabylonControlledCombatantData();
    }

    gameState.babylonControlledCombatantDOMData[combatantId]?.debugMessages.push(newMessage);
    gameState.lastDebugMessageId += 1;
    setTimeout(() => {
      mutateGameState((gameState) => {
        removeDebugMessage(gameState, combatantId, newMessage.id);
      });
    }, displayTime);
  });
}

export function removeDebugMessage(gameState: GameState, combatantId: string, messageId: string) {
  const indicesToRemove: number[] = [];
  gameState.babylonControlledCombatantDOMData[combatantId]?.debugMessages.forEach(
    (message, index) => {
      if (messageId === message.id) {
        indicesToRemove.push(index);
      }
    }
  );
  indicesToRemove.forEach((index) => {
    gameState.babylonControlledCombatantDOMData[combatantId]?.debugMessages.splice(index, 1);
  });
}
