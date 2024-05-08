class Node<T> {
  public value: T | undefined;
  public prev: Node<T> | null;
  public next: Node<T> | null;

  constructor(value: T | undefined) {
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

export class VecDeque<T> {
  private front: Node<T> | null;
  private back: Node<T> | null;
  private size: number;

  constructor() {
    this.front = null;
    this.back = null;
    this.size = 0;
  }

  isEmpty(): boolean {
    return this.size === 0;
  }

  getSize(): number {
    return this.size;
  }

  pushFront(value: T): void {
    const newNode = new Node<T>(value);
    if (this.isEmpty()) {
      this.front = newNode;
      this.back = newNode;
    } else {
      newNode.next = this.front;
      this.front!.prev = newNode;
      this.front = newNode;
    }
    this.size++;
  }

  pushBack(value: T): void {
    const newNode = new Node<T>(value);
    if (this.isEmpty()) {
      this.front = newNode;
      this.back = newNode;
    } else {
      newNode.prev = this.back;
      this.back!.next = newNode;
      this.back = newNode;
    }
    this.size++;
  }

  popFront(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    const value = this.front!.value;
    this.front = this.front!.next;
    if (this.front) {
      this.front.prev = null;
    } else {
      this.back = null;
    }
    this.size--;
    return value;
  }

  popBack(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    const value = this.back!.value;
    this.back = this.back!.prev;
    if (this.back) {
      this.back.next = null;
    } else {
      this.front = null;
    }
    this.size--;
    return value;
  }

  peekFront(): T | undefined {
    return this.front?.value;
  }

  peekBack(): T | undefined {
    return this.back?.value;
  }

  clear(): void {
    this.front = null;
    this.back = null;
    this.size = 0;
  }
}

