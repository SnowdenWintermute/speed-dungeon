export enum UserAuthStatus {
  LoggedIn,
  Guest,
}

export class UserChannelDisplayData {
  constructor(public authStatus: UserAuthStatus) {}
}
