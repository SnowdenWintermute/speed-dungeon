// user has multiple sessions (tabs/windows open)
export class Session {
  public currentGame: null | string = null;
  constructor(
    public mainSocketId: string,
    public partySocketId: string
  ) {}
}
