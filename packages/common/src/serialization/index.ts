export interface Serializable {
  toSerialized(): object;
}

export interface ReactiveNode {
  makeObservable(): void;
}

function isReactiveNode(value: unknown): value is ReactiveNode {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ReactiveNode).makeObservable === "function"
  );
}

export function makePropertiesObservable(node: object) {
  for (const value of Object.values(node)) {
    if (isReactiveNode(value)) {
      console.log("making observable:", value);
      value.makeObservable();
    }
  }
}

export type SerializedOf<T extends { toSerialized(): unknown }> = ReturnType<T["toSerialized"]>;
