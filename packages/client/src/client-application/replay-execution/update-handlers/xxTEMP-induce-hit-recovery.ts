import {
  ResourceChange,
  ActionPayableResource,
  CombatActionName,
  COMBAT_ACTIONS,
  Combatant,
} from "@speed-dungeon/common";
import { characterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import { GameLogMessageService } from "@/mobx-stores/game-event-notifications/game-log-message-service";
import { ClientApplication } from "@/client-application";
import { CharacterModel } from "@/game-world-view/scene-entities/character-models";

export class CombatantResourceChangeUpdateHandlerCommand {
  targetCombatant: Combatant;
  targetModel?: CharacterModel;
  constructor(
    private clientApplication: ClientApplication,
    private actionUserName: string,
    private actionUserId: string,
    private actionName: CombatActionName,
    private resourceChange: ResourceChange,
    private resourceType: ActionPayableResource,
    private targetId: string,
    private wasBlocked: boolean,
    private shouldAnimate: boolean
  ) {
    this.targetCombatant = this.clientApplication.gameContext.requireCombatant(targetId);
    this.targetModel = this.clientApplication.gameWorldView?.modelManager.findOneOptional(targetId);
  }

  execute() {
    const combatantProperties = this.targetCombatant.getCombatantProperties();
    this.updateResources();
    this.dispatchFloatingMessage();
    this.dispatchEventLogMessage();
    if (combatantProperties.isDead()) {
      this.handleDeath();
    } else if (this.resourceChange.value < 0 && this.shouldAnimate) {
      this.targetModel?.startHitRecoveryAnimation(this.wasBlocked, this.resourceChange.isCrit);
    }
  }

  private updateResources() {
    const { resources } = this.targetCombatant.getCombatantProperties();
    if (this.resourceType === ActionPayableResource.HitPoints) {
      resources.changeHitPoints(this.resourceChange.value);
    }
    if (this.resourceType === ActionPayableResource.Mana) {
      resources.changeMana(this.resourceChange.value);
    }
  }

  private dispatchFloatingMessage() {
    this.clientApplication.floatingMessagesService.startResourceChangeFloatingMessage(
      this.targetId,
      this.resourceChange,
      this.resourceType,
      this.wasBlocked
    );
  }

  private dispatchEventLogMessage() {
    const action = COMBAT_ACTIONS[this.actionName];
    const shouldPostResourceChange = !action.gameLogMessageProperties.doNotPostResourceChange;

    if (shouldPostResourceChange) {
      this.clientApplication.eventLogMessageService.postResourceChange(
        this.resourceChange,
        this.resourceType,
        action,
        this.wasBlocked,
        this.targetCombatant,
        this.actionUserName,
        this.actionUserId === this.targetCombatant.getEntityId()
      );
    }
  }

  private handleDeath() {
    const { game, party } = this.clientApplication.gameContext.requireCombatantContext(
      this.targetId
    );
    const battleOption = party.getBattleOption(game);

    if (this.combatantDiedOnOwnTurn()) {
      battleOption?.turnOrderManager.updateTrackers(game, party);
    }

    const newlyActiveTracker = battleOption?.turnOrderManager.getFastestActorTurnOrderTracker();
    if (newlyActiveTracker !== undefined) {
      characterAutoFocusManager.updateFocusedCharacterOnNewTurnOrder(newlyActiveTracker);
    }

    const shouldRemove = this.targetCombatant.getCombatantProperties().removeFromPartyOnDeath;
    if (shouldRemove) {
      party.combatantManager.removeCombatant(this.targetCombatant.getEntityId(), game);
    }

    this.postDeathMessage();
    this.targetModel?.handleDeath();
  }

  private combatantDiedOnOwnTurn() {
    const { game, party } = this.clientApplication.gameContext.requireCombatantContext(
      this.targetId
    );

    const battleOption = party.getBattleOption(game);
    if (battleOption === null) {
      return false;
    } else {
      return battleOption.turnOrderManager.combatantIsFirstInTurnOrder(this.targetId);
    }
  }

  private postDeathMessage() {
    const action = COMBAT_ACTIONS[this.actionName];
    const shouldPostResourceChange = !action.gameLogMessageProperties.doNotPostResourceChange;
    if (shouldPostResourceChange) {
      GameLogMessageService.postCombatantDeath(this.targetCombatant.getName());
    }
  }
}
