export type EventCallback = (...args: any[]) => void;

export class EventEmitter {
  private events: Record<string, EventCallback[]> = {};

  /**
   * Register an event listener
   * @param event Event name
   * @param callback Function to be called when the event is emitted
   */
  on(event: string, callback: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  /**
   * Register a one-time event listener
   * @param event Event name
   * @param callback Function to be called when the event is emitted
   */
  once(event: string, callback: EventCallback): void {
    const onceWrapper = (...args: any[]) => {
      callback(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  /**
   * Remove an event listener
   * @param event Event name
   * @param callback Function to remove
   */
  off(event: string, callback: EventCallback): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  /**
   * Emit an event
   * @param event Event name
   * @param args Arguments to pass to the event listeners
   */
  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    this.events[event].forEach((callback) => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Remove all listeners for an event
   * @param event Event name (optional - if not provided, removes all listeners)
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.events[event] = [];
    } else {
      this.events = {};
    }
  }
}
