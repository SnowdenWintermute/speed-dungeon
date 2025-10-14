import { ActionResolutionStepContext } from "../../action-processing/index.js";
import { AdventuringParty } from "../../adventuring-party/index.js";
import { TargetingCalculator } from "../targeting/targeting-calculator.js";
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

export interface CombatActionGameLogPropertiesConfig {
  origin?: CombatActionOrigin;
  getOnUseMessage?: null | ((messageData: ActionUseMessageData) => string);
  getOnUseMessageDataOverride?: (context: ActionResolutionStepContext) => ActionUseMessageData;
}

export class CombatActionGameLogProperties {
  public origin: CombatActionOrigin = CombatActionOrigin.Attack;
  public getOnUseMessage: null | ((messageData: ActionUseMessageData) => string) = null;
  /** Used by the combat log to determine how to format messages */
  constructor(config: CombatActionGameLogPropertiesConfig) {
    if (config.origin !== undefined) this.origin = config.origin;
    if (config.getOnUseMessage) this.getOnUseMessage = config.getOnUseMessage;
    if (config.getOnUseMessageDataOverride)
      this.getOnUseMessageData = config.getOnUseMessageDataOverride;
  }

  getOnUseMessageData(context: ActionResolutionStepContext): ActionUseMessageData {
    const { actionUserContext } = context;
    const { actionUser, party } = actionUserContext;
    const { actionExecutionIntent } = context.tracker;
    const { rank, actionName, targets } = actionExecutionIntent;

    const targetingCalculator = new TargetingCalculator(actionUserContext, null);
    const primaryTarget = targetingCalculator.getPrimaryTargetCombatant(
      party,
      actionExecutionIntent
    );
    let nameOfTarget = "A missing target with the following identifier " + JSON.stringify(targets);
    if (!(primaryTarget instanceof Error)) nameOfTarget = primaryTarget.getName();

    return {
      nameOfActionUser: actionUser.getName(),
      nameOfTarget,
      actionLevel: rank,
    };
  }
}

export function getSpellCastGameLogMessage(data: ActionUseMessageData, spellName: string) {
  return `${data.nameOfActionUser} casts ${spellName} (level ${data.actionLevel})`;
}

export function createGenericSpellCastMessageProperties(actionName: CombatActionName) {
  return new CombatActionGameLogProperties({
    origin: CombatActionOrigin.SpellCast,
    getOnUseMessage: (data) =>
      getSpellCastGameLogMessage(data, COMBAT_ACTION_NAME_STRINGS[actionName]),
  });
}
