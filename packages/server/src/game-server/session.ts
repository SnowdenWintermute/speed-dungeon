// user can have multiple sessions (tabs/windows open)
export class Session {
  public currentGame: null | string = null;
  public currentPartyName: null | string = null;
  constructor(public socketId: string) {}
}
