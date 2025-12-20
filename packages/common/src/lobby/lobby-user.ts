import { ERROR_MESSAGES } from "../errors/index.js";
import { ActionValidity, LOBBY_CHANNEL, SpeedDungeonGame } from "../index.js";

export class LobbyUser {
  public currentGameName: null | string = null;
  public currentPartyName: null | string = null;
  public channels: string[] = [LOBBY_CHANNEL];

  constructor(
    public username: string,
    /** either a socket.id or a locally generated UUID on client */
    public connectionId: string,
    /** snowauth user id */
    public userId: null | number
  ) {}

  canJoinNewGame(isRanked?: boolean): ActionValidity {
    if (this.currentGameName !== null) {
      return new ActionValidity(false, ERROR_MESSAGES.LOBBY.ALREADY_IN_GAME);
    }

    const userIsGuest = this.userId === null;
    if (isRanked && userIsGuest) {
      return new ActionValidity(false, ERROR_MESSAGES.AUTH.REQUIRED);
    }

    return new ActionValidity(true);
  }

  joinGame(game: SpeedDungeonGame) {
    game.registerPlayerFromLobbyUser(this);
    this.currentGameName = game.name;
  }
}
