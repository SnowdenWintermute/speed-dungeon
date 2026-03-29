import { ERROR_MESSAGES, Username } from "@speed-dungeon/common";
import { makeAutoObservable } from "mobx";

export class ClientApplicationSession {
  private username: null | Username = null;

  constructor() {
    makeAutoObservable(this);
  }

  setUsername(username: Username) {
    this.username = username;
  }

  clearUsername() {
    this.username = null;
  }

  get usernameOption() {
    return this.username;
  }

  requireUsername() {
    if (this.usernameOption === null) {
      throw new Error(ERROR_MESSAGES.CLIENT.NO_USERNAME);
    }
    return this.usernameOption;
  }
}
