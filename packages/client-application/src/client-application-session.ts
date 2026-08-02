import { ERROR_MESSAGES, UserAuthStatus, Username } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export class ClientApplicationSession {
  private username: null | Username = null;
  private authStatus = UserAuthStatus.Guest;

  constructor() {
    makeAutoObservable(this);
  }

  setUser(username: Username, authStatus: UserAuthStatus) {
    this.username = username;
    this.authStatus = authStatus;
  }

  clearUser() {
    this.username = null;
    this.authStatus = UserAuthStatus.Guest;
  }

  get usernameOption() {
    return this.username;
  }

  get isLoggedIn() {
    return this.authStatus === UserAuthStatus.LoggedIn;
  }

  requireUsername() {
    if (this.usernameOption === null) {
      throw new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
    }
    return this.usernameOption;
  }
}
