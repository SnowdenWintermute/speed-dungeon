import { ActionResolutionStepContext } from "../../action-processing/index.js";
import { COMBAT_ACTION_NAME_STRINGS, CombatActionName } from "./combat-action-names.js";

export enum CombatActionOrigin {
  SpellCast,
  TriggeredCondition,
  Medication,
  Attack,
}

export interface ActionUseMessageData {
  nameOfActionUser?: string;
  nameOfTarget?: string;
  actionLevel?: number;
}

export interface CombatActionCombatLogPropertiesConfig {
  origin?: CombatActionOrigin;
  getOnUseMessage?: null | ((messageData: ActionUseMessageData) => string);
  getOnUseMessageDataOverride?: (context: ActionResolutionStepContext) => ActionUseMessageData;
}

export class CombatActionCombatLogProperties {
  public origin: CombatActionOrigin = CombatActionOrigin.Attack;
  public getOnUseMessage: null | ((messageData: ActionUseMessageData) => string) = null;
  /** Used by the combat log to determine how to format messages */
  constructor(config: CombatActionCombatLogPropertiesConfig) {
    if (config.origin !== undefined) this.origin = config.origin;
    if (config.getOnUseMessage) this.getOnUseMessage = config.getOnUseMessage;
    if (config.getOnUseMessageDataOverride)
      this.getOnUseMessageData = config.getOnUseMessageDataOverride;
  }

  getOnUseMessageData(context: ActionResolutionStepContext): ActionUseMessageData {
    const { actionUserContext } = context;
    const { actionUser } = actionUserContext;
    const selectedActionAndRankOption = actionUser
      .getTargetingProperties()
      .getSelectedActionAndRank();
    const actionLevel = selectedActionAndRankOption?.rank || 0;
    return {
      nameOfActionUser: actionUser.getName(),
      actionLevel,
    };
  }
}

export function getSpellCastCombatLogMessage(data: ActionUseMessageData, spellName: string) {
  return `${data.nameOfActionUser} casts ${spellName} (level ${data.actionLevel})`;
}

export function createGenericSpellCastMessageProperties(actionName: CombatActionName) {
  return new CombatActionCombatLogProperties({
    origin: CombatActionOrigin.SpellCast,
    getOnUseMessage: (data) =>
      getSpellCastCombatLogMessage(data, COMBAT_ACTION_NAME_STRINGS[actionName]),
  });
}
