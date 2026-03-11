import {
  CombatantContext,
  CombatantId,
  ERROR_MESSAGES,
  EntityId,
  SpeedDungeonGame,
  Username,
} from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";
import { ClientApplicationSession } from "./client-application-session";

export class ClientApplicationGameContext {
  private game: null | SpeedDungeonGame = null;
  constructor(private clientSession: ClientApplicationSession) {
    makeAutoObservable(this);
  }

  setGame(game: SpeedDungeonGame) {
    this.game = game;
  }

  clearGame() {
    this.game = null;
  }

  get gameOption() {
    return this.game;
  }

  requireGame() {
    if (this.game === null) {
      throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_GAME);
    }
    return this.game;
  }

  private requirePlayer(username: Username) {
    const playerOption = this.requireGame().getPlayer(username);
    if (playerOption === undefined) {
      throw new Error(ERROR_MESSAGES.GAME.PLAYER_DOES_NOT_EXIST);
    }
    return playerOption;
  }

  requireClientPlayer() {
    return this.requirePlayer(this.clientSession.requireUsername());
  }

  get partyOption() {
    const { usernameOption } = this.clientSession;

    if (usernameOption === null) {
      return undefined;
    }
    if (this.game === null) {
      return undefined;
    }
    const player = this.game.getPlayer(usernameOption);
    if (!player) {
      return undefined;
    }
    return this.game.getPlayerPartyOption(player.username);
  }

  requireParty() {
    if (this.partyOption === undefined) {
      throw new Error(ERROR_MESSAGES.CLIENT.NO_CURRENT_PARTY);
    }
    return this.partyOption;
  }

  getCombatantOption(combatantId: EntityId) {
    return this.partyOption?.combatantManager.getCombatantOption(combatantId);
  }

  requireCombatant(combatantId: EntityId) {
    return this.requireParty().combatantManager.getExpectedCombatant(combatantId);
  }

  requirePlayerContext(username: Username) {
    const game = this.requireGame();
    const player = game.getExpectedPlayer(username);
    if (player.partyName === null) {
      throw new Error(ERROR_MESSAGES.PLAYER.NOT_IN_PARTY);
    }
    const party = game.getExpectedParty(player.partyName);
    return { game, party, player };
  }

  requireCombatantContext(combatantId: EntityId): CombatantContext {
    const party = this.requireParty();
    const game = this.requireGame();
    const combatant = party.combatantManager.getExpectedCombatant(combatantId);
    return new CombatantContext(game, party, combatant);
  }

  clientUserControlsCombatant(combatantId: CombatantId) {
    const { usernameOption } = this.clientSession;
    const partyOption = this.partyOption;
    if (!usernameOption || !partyOption) {
      return false;
    }

    return partyOption.combatantManager.playerOwnsCharacter(usernameOption, combatantId);
  }
}
