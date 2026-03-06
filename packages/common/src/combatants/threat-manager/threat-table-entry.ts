import { makeAutoObservable } from "mobx";
import { MaxAndCurrent } from "../../primatives/max-and-current.js";
import { STABLE_THREAT_CAP, ThreatType, VOLATILE_THREAT_CAP } from "./index.js";
import { ReactiveNode, Serializable, SerializedOf } from "../../serialization/index.js";

export class ThreatTableEntry implements Serializable, ReactiveNode {
  public threatScoresByType: Record<ThreatType, MaxAndCurrent> = {
    [ThreatType.Stable]: new MaxAndCurrent(STABLE_THREAT_CAP, 0),
    [ThreatType.Volatile]: new MaxAndCurrent(VOLATILE_THREAT_CAP, 0),
  };

  makeObservable() {
    makeAutoObservable(this);
    this.threatScoresByType[ThreatType.Stable].makeObservable();
    this.threatScoresByType[ThreatType.Volatile].makeObservable();
    console.log("made threat scores makeObservable");
  }

  toSerialized() {
    return {
      threatScoresByType: {
        [ThreatType.Stable]: this.threatScoresByType[ThreatType.Stable].toSerialized(),
        [ThreatType.Volatile]: this.threatScoresByType[ThreatType.Volatile].toSerialized(),
      },
    };
  }

  static fromSerialized(serialized: SerializedOf<ThreatTableEntry>) {
    const result = new ThreatTableEntry();
    result.threatScoresByType = {
      [ThreatType.Stable]: MaxAndCurrent.fromSerialized(
        serialized.threatScoresByType[ThreatType.Stable]
      ),
      [ThreatType.Volatile]: MaxAndCurrent.fromSerialized(
        serialized.threatScoresByType[ThreatType.Volatile]
      ),
    };

    return result;
  }

  getTotal() {
    return (
      this.threatScoresByType[ThreatType.Stable].current +
      this.threatScoresByType[ThreatType.Volatile].current
    );
  }
}
