export class HashSet<T> {
  private items: {
    [item: string]: "";
  };

  constructor() {
    this.items = {};
  }

  insert(item: T): void {
    if (typeof item === "string") this.items[item] = "";
    else this.items[JSON.stringify(item)] = "";
    console.log("this hashset's items", this.items);
  }

  remove(item: T): void {
    if (typeof item === "string") delete this.items[item];
    else delete this.items[JSON.stringify(item)];
  }

  has(item: string): boolean {
    if (typeof item === "string") return item in this.items;
    else return JSON.stringify(item) in this.items;
  }

  values(): string[] {
    return Object.keys(this.items);
  }

  clear(): void {
    this.items = {};
  }

  size(): number {
    return Object.keys(this.items).length;
  }
}
