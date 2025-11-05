import { Exclude } from "class-transformer";
import { CombatantProperties } from "./combatant-properties.js";
import { ERROR_MESSAGES } from "../errors/index.js";

export class CombatantSubsystem {
  // The @Exclude() decorator from class-transformer means this property won't be included
  // when we call instanceToPlain when serializing so we don't try to send a circular reference
  // over the wire or when persisting to the database
  @Exclude()
  private combatantProperties: CombatantProperties | undefined;

  initialize(combatantProperties: CombatantProperties) {
    this.combatantProperties = combatantProperties;
  }

  protected getCombatantProperties() {
    if (this.combatantProperties === undefined) {
      throw new Error(ERROR_MESSAGES.CLASS_INSTANCE_NOT_INITIALIZED);
    }
    return this.combatantProperties;
  }
}
