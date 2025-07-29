import { ActionUseMessageData } from "..";

export function getSpellCastCombatLogMessage(data: ActionUseMessageData, spellName: string) {
  return `${data.nameOfActionUser} casts ${spellName} (level ${data.actionLevel})`;
}
