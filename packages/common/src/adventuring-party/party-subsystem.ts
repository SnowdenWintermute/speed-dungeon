import { Exclude } from "class-transformer";
import { ERROR_MESSAGES } from "../errors/index.js";
import { AdventuringParty } from "./index.js";

export class AdventuringPartySubsystem {
  // The @Exclude() decorator from class-transformer means this property won't be included
  // when we call instanceToPlain when serializing so we don't try to send a circular reference
  // over the wire or when persisting to the database
  @Exclude()
  private party: AdventuringParty | undefined;

  initialize(party: AdventuringParty) {
    this.party = party;
  }

  protected getParty() {
    if (this.party === undefined) {
      throw new Error(ERROR_MESSAGES.CLASS_INSTANCE_NOT_INITIALIZED);
    }
    return this.party;
  }
}
