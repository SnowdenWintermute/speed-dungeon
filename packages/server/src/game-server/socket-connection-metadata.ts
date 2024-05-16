export class SocketConnectionMetadata {
  partySocketId: null | string = null;
  constructor(
    public socketId: string,
    public username: string,
    public currentMainChannelName: null | string,
    public currentPartyChannelName: null | string = null,
    public currentGameName: null | string = null
  ) {}
}
