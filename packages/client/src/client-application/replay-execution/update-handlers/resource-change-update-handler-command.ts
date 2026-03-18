import {
  ResourceChange,
  ActionPayableResource,
  COMBAT_ACTIONS,
  Combatant,
  ActivatedTriggersGameUpdateCommand,
  HitOutcomesGameUpdateCommand,
  CombatActionComponent,
} from "@speed-dungeon/common";
import { characterAutoFocusManager } from "@/singletons/character-autofocus-manager";
import { GameLogMessageService } from "@/mobx-stores/game-event-notifications/game-log-message-service";
import { ClientApplication } from "@/client-application";
import { CombatantSceneEntity } from "@/xxNEW-game-world-view/scene-entities/combatants";

type GameUpdateCommandWithResourceChanges =
  | ActivatedTriggersGameUpdateCommand
  | HitOutcomesGameUpdateCommand;

export class CombatantResourceChangeUpdateHandlerCommand {
  targetCombatant: Combatant;
  targetSceneEntity?: CombatantSceneEntity;
  action: CombatActionComponent;
  constructor(
    private clientApplication: ClientApplication,
    private gameUpdateCommand: GameUpdateCommandWithResourceChanges,
    private resourceChange: ResourceChange,
    private resourceType: ActionPayableResource,
    private targetId: string,
    private wasBlocked: boolean,
    private shouldAnimate: boolean
  ) {
    this.targetCombatant = this.clientApplication.gameContext.requireCombatant(targetId);
    this.targetSceneEntity =
      this.clientApplication.gameWorldView?.sceneEntityService.combatantSceneEntityManager.getOptional(
        targetId
      );
    this.action = COMBAT_ACTIONS[gameUpdateCommand.actionName];
  }

  execute() {
    const combatantProperties = this.targetCombatant.getCombatantProperties();
    this.updateResources();
    this.dispatchFloatingMessage();
    this.dispatchEventLogMessage();
    if (combatantProperties.isDead()) {
      this.handleDeath();
    } else if (this.resourceChange.value < 0 && this.shouldAnimate) {
      this.targetSceneEntity?.animationControls.startHitRecoveryAnimation(
        this.wasBlocked,
        this.resourceChange.isCrit
      );
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
    const shouldPostResourceChange = !this.action.gameLogMessageProperties.doNotPostResourceChange;

    if (!shouldPostResourceChange) {
      return;
    }

    this.clientApplication.eventLogMessageService.postResourceChange(
      this.resourceChange,
      this.resourceType,
      this.action,
      this.wasBlocked,
      this.targetCombatant,
      this.gameUpdateCommand.actionUserName,
      this.gameUpdateCommand.actionUserId === this.targetCombatant.getEntityId()
    );
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
    this.targetSceneEntity?.handleDeath();
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
    const shouldPostResourceChange = !this.action.gameLogMessageProperties.doNotPostResourceChange;
    if (shouldPostResourceChange) {
      GameLogMessageService.postCombatantDeath(this.targetCombatant.getName());
    }
  }
}
