import { makeAutoObservable } from "mobx";

export class FormsStore {
  private authFormEmailField = "";
  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setAuthFormEmailField(email: string) {
    this.authFormEmailField = email;
  }

  getAuthFormEmailField() {
    return this.authFormEmailField;
  }
}
