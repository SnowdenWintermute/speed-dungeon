export class HashMap<T, U> {
  private items: {
    [item: string]: U;
  };

  constructor() {
    this.items = {};
  }

  insert(key: T, item: U): void {
    if (typeof key === "string") this.items[key] = item;
    else this.items[JSON.stringify(key)] = item;
  }

  remove(key: T): void {
    if (typeof key === "string") delete this.items[key];
    else delete this.items[JSON.stringify(key)];
  }

  has(key: T): boolean {
    if (typeof key === "string") return key in this.items;
    else return JSON.stringify(key) in this.items;
  }

  get(key: T): U {
    if (typeof key === "string") return this.items[key];
    else return this.items[JSON.stringify(key)];
  }

  values(): U[] {
    return Object.values(this.items);
  }

  clear(): void {
    this.items = {};
  }

  size(): number {
    return Object.keys(this.items).length;
  }
}
