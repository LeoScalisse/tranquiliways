type Handler<T = unknown> = (data: T) => void;

class EventBusClass {
  private listeners = new Map<string, Set<Handler>>();

  on<T>(event: string, handler: Handler<T>): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler as Handler);
    return () => this.listeners.get(event)?.delete(handler as Handler);
  }

  once<T>(event: string, handler: Handler<T>): void {
    const wrap = (data: T) => { handler(data); this.listeners.get(event)?.delete(wrap as Handler); };
    this.on(event, wrap);
  }

  emit<T>(event: string, data: T): void {
    this.listeners.get(event)?.forEach((h) => h(data));
  }

  clear(): void { this.listeners.clear(); }
}

export const EventBus = new EventBusClass();

export const EVENTS = {
  SCENE_ENTER: "scene:enter",
  PORTAL_TRIGGER: "portal:trigger",
  CHARACTER_MOVE: "character:move",
} as const;
