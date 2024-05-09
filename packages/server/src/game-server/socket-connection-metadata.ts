export class SocketConnectionMetadata {
  constructor(
    public socketId: string,
    public username: string,
    public currentMainChannelName: string,
    public currentPartyChannelName?: string | undefined,
    public currentGameName?: string | null
  ) {}
}
