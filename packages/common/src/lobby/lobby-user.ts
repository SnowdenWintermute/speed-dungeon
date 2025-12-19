export class LobbyUser {
  constructor(
    public username: string,
    /** snowauth user id */
    public userId: null | number,
    public currentGameName: null | string = null,
    public currentPartyName: null | string = null
  ) {}
}
