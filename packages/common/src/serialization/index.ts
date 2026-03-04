export interface Serializable {
  getSerialized(): object;
}

// Can't enforce static methods in an interface, but you can enforce
// the shape at the places that consume deserialization:
export interface DeserializableConstructor<TClass> {
  new (...args: any[]): TClass;
  getDeserialized(data: any): TClass;
}
