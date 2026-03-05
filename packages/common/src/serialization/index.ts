export interface Serializable {
  toSerialized(): object;
}

export interface ReactiveNode {
  makeObservable(): void;
}

export type SerializedOf<T extends { toSerialized(): unknown }> = ReturnType<T["toSerialized"]>;
