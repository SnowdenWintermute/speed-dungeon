import {
  ACTION_PAYABLE_RESOURCE_STRINGS,
  ActionPayableResource,
  ActionUseGameLogMessageUpdateCommand,
  COMBAT_ACTIONS,
  CRAFTING_ACTION_PAST_TENSE_STRINGS,
  CombatActionComponent,
  CombatActionOrigin,
  CraftingAction,
  Equipment,
  GameMessage,
  GameMessageType,
  HP_CHANGE_SOURCE_CATEGORY_STRINGS,
  IActionUser,
  Item,
  KINETIC_DAMAGE_TYPE_STRINGS,
  MAGICAL_ELEMENT_STRINGS,
  ResourceChange,
} from "@speed-dungeon/common";
import { AppStore } from "../app-store";
import {
  COMBAT_LOG_MESSAGE_STYLES_BY_MESSAGE_TYPE,
  GameLogMessage,
  GameLogMessageStyle,
} from "./game-log-messages";
import { ReactNode } from "react";
import cloneDeep from "lodash.clonedeep";
import { ItemLink } from "./item-link";
import { toJS } from "mobx";
import { plainToInstance } from "class-transformer";

export class GameLogMessageService {
  private static dispatch(message: GameLogMessage) {
    const { gameEventNotificationStore } = AppStore.get();
    gameEventNotificationStore.postGameLogMessage(message);
  }

  static postGameStarted() {
    this.dispatch(new GameLogMessage("A new game has begun!", GameLogMessageStyle.Basic));
  }

  static postActionUse(command: ActionUseGameLogMessageUpdateCommand) {
    {
      const { actionUseMessageData, actionName } = command;
      const action = COMBAT_ACTIONS[actionName];
      if (!action.gameLogMessageProperties.getOnUseMessage) return;

      const message = action.gameLogMessageProperties.getOnUseMessage(actionUseMessageData);
      this.dispatch(new GameLogMessage(message, GameLogMessageStyle.Basic));
    }
  }

  static postUserLeftGame(username: string) {
    this.dispatch(new GameLogMessage(`${username} left the game`, GameLogMessageStyle.PartyWipe));
  }

  static postGameMessage(message: GameMessage) {
    const style = COMBAT_LOG_MESSAGE_STYLES_BY_MESSAGE_TYPE[message.type];
    this.dispatch(new GameLogMessage(message.message, style));
  }

  static postActionMissed(actionUserName: string, targetName: string) {
    const style = GameLogMessageStyle.Basic;
    const messageText = `${actionUserName} failed to hit ${targetName}`;
    this.dispatch(new GameLogMessage(messageText, style));
  }

  static postActionEvaded(actionUserName: string, targetName: string) {
    const style = GameLogMessageStyle.Basic;
    const messageText = `${targetName} evaded an attack from ${actionUserName}`;
    this.dispatch(new GameLogMessage(messageText, style));
  }

  static postActionParried(actionUserName: string, targetName: string) {
    const style = GameLogMessageStyle.Basic;
    const messageText = `${targetName} parried an attack from ${actionUserName}`;
    this.dispatch(new GameLogMessage(messageText, style));
  }

  static postActionCountered(actionUserName: string, targetName: string) {
    const style = GameLogMessageStyle.Basic;
    const messageText = `${targetName} countered an attack from ${actionUserName}`;
    this.dispatch(new GameLogMessage(messageText, style));
  }

  static postItemLink(posterName: string, item: Item) {
    this.dispatch(
      new GameLogMessage(
        (
          <div>
            {posterName} calls attention to <ItemLink item={item} />
          </div>
        ),
        COMBAT_LOG_MESSAGE_STYLES_BY_MESSAGE_TYPE[GameMessageType.CraftingAction]
      )
    );
  }

  static postCraftActionResult(
    crafterName: string,
    itemBeforeModification: Equipment,
    craftingAction: CraftingAction,
    itemResult: Equipment
  ) {
    // post combat log message about the crafted result with hoverable item inspection link
    const style = COMBAT_LOG_MESSAGE_STYLES_BY_MESSAGE_TYPE[GameMessageType.CraftingAction];
    let craftingResultMessage: ReactNode = "";

    const item = plainToInstance(Equipment, cloneDeep(toJS(itemResult)));

    const craftedItemLink = <ItemLink item={item} />;

    switch (craftingAction) {
      case CraftingAction.Repair:
        break;
      case CraftingAction.Reform:
      case CraftingAction.Shake:
        craftingResultMessage = <div> resulting in {craftedItemLink}</div>;
        break;
      case CraftingAction.Imbue:
      case CraftingAction.Augment:
      case CraftingAction.Tumble:
        craftingResultMessage = <div> and created {craftedItemLink}</div>;
    }

    this.dispatch(
      new GameLogMessage(
        (
          <div>
            {crafterName} {CRAFTING_ACTION_PAST_TENSE_STRINGS[craftingAction]}{" "}
            <ItemLink item={itemBeforeModification} />
            {craftingResultMessage}
          </div>
        ),
        style
      )
    );
  }

  static postCombatantDeath(targetName: string) {
    this.dispatch(
      new GameLogMessage(`${targetName}'s hp was reduced to zero`, GameLogMessageStyle.Basic)
    );
  }

  static postExperienceGained(gainerName: string, value: number) {
    this.dispatch(
      new GameLogMessage(
        `${gainerName} gained ${value} experience points`,
        GameLogMessageStyle.PartyProgress
      )
    );
  }

  static postLevelup(levelerName: string, newLevel: number) {
    this.dispatch(
      new GameLogMessage(
        `${levelerName} reached level ${newLevel}!`,
        GameLogMessageStyle.PartyProgress
      )
    );
  }

  static postWipeMessage() {
    this.dispatch(new GameLogMessage("Your party was defeated", GameLogMessageStyle.PartyWipe));
  }

  static postResourceChange(
    resourceChange: ResourceChange,
    resourceType: ActionPayableResource,
    action: CombatActionComponent,
    wasBlocked: boolean,
    target: IActionUser,
    actionUserName: string,
    actionUserTargetingSelf: boolean,
    showDebug: boolean
  ) {
    const { elementOption, kineticDamageTypeOption } = resourceChange.source;

    let elementOptionString: string = "";
    if (elementOption !== undefined)
      elementOptionString = ` ${MAGICAL_ELEMENT_STRINGS[elementOption].toLowerCase()}`;

    let kineticOptionString = "";
    if (kineticDamageTypeOption !== undefined)
      kineticOptionString = ` ${KINETIC_DAMAGE_TYPE_STRINGS[kineticDamageTypeOption].toLowerCase()}`;

    const resourceChangeSourceCategoryText =
      HP_CHANGE_SOURCE_CATEGORY_STRINGS[resourceChange.source.category].toLowerCase();

    let manaDamage = "";
    if (resourceType === ActionPayableResource.Mana) manaDamage = " mana";

    const resourceTypeString = ACTION_PAYABLE_RESOURCE_STRINGS[resourceType].toLowerCase();

    const sOption = Math.abs(resourceChange.value) > 1 ? "s" : "";
    const damageText = `point${sOption} of ${resourceChangeSourceCategoryText + kineticOptionString + elementOptionString}${manaDamage} damage`;

    const resourceTypeOrDamageText = resourceChange.value > 0 ? resourceTypeString : damageText;

    let style = GameLogMessageStyle.Basic;
    if (resourceType === ActionPayableResource.HitPoints && resourceChange.value > 0)
      style = GameLogMessageStyle.Healing;

    if (resourceType === ActionPayableResource.Mana && resourceChange.value > 0)
      style = GameLogMessageStyle.Mana;

    let messageText = "";

    const { gameLogMessageProperties } = action;
    const { origin } = gameLogMessageProperties;

    if (spellLikeOrigins.includes(origin)) {
      const damagedOrHealed = resourceChange.value > 0 ? "recovers" : "takes";
      messageText = `${target.getName()} ${damagedOrHealed} ${Math.abs(resourceChange.value)} ${resourceTypeOrDamageText}`;
    } else {
      let recoveryWord = "healed";
      if (resourceType === ActionPayableResource.Mana) recoveryWord = "refreshed";
      const damagedOrHealed = resourceChange.value > 0 ? recoveryWord : "hit";

      const targetId = target.getEntityId();

      const targetNameText = actionUserTargetingSelf ? "themselves" : target.getName();

      const debugTargetId = showDebug ? targetId : "";
      messageText = `${actionUserName} ${damagedOrHealed} ${targetNameText} ${debugTargetId} for ${Math.abs(resourceChange.value)} ${resourceTypeOrDamageText}`;
    }

    if (resourceChange.isCrit) messageText = "Critical! " + messageText;
    if (wasBlocked) messageText = "Shield block: " + messageText;

    this.dispatch(new GameLogMessage(messageText, style));
  }
}

const spellLikeOrigins = [
  CombatActionOrigin.SpellCast,
  CombatActionOrigin.Medication,
  CombatActionOrigin.TriggeredCondition,
];
