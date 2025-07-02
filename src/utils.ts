export const parseUrl = (url: string) => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

export const uuid4 = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export class Queue {
  _items: any[] = [];
  enqueue(item: any) {
    this._items.push(item);
  }

  dequeue() {
    return this._items.shift();
  }

  get size() {
    return this._items.length;
  }
}

export class AutoQueue extends Queue {
  _pendingPromise = false;
  enqueue<T>(action: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      super.enqueue({ action, resolve, reject });
      this.dequeue();
    });
  }

  async dequeue() {
    if (this._pendingPromise) return false;
    const item = super.dequeue();
    if (!item) return false;

    try {
      this._pendingPromise = true;
      const payload = await item.action(this);
      this._pendingPromise = false;
      item.resolve(payload);
    } catch (e) {
      this._pendingPromise = false;
      item.reject(e);
    } finally {
      void this.dequeue();
    }

    return true;
  }
}
