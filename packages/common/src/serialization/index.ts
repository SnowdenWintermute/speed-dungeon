export interface Serializable {
  getSerialized(): object;
}

export interface ReactiveNode {
  makeObservable(): void;
}
