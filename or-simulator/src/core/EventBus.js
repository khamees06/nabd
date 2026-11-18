/** Small synchronous event bus used to keep simulation services independent of UI. */
export function createEventBus() {
  const listeners = new Map();

  function on(type, listener) {
    if (typeof listener !== 'function') throw new TypeError('Event listener must be a function.');
    const bucket = listeners.get(type) ?? new Set();
    bucket.add(listener);
    listeners.set(type, bucket);
    return () => off(type, listener);
  }

  function once(type, listener) {
    let unsubscribe;
    unsubscribe = on(type, (detail) => {
      unsubscribe();
      listener(detail);
    });
    return unsubscribe;
  }

  function off(type, listener) {
    const bucket = listeners.get(type);
    if (!bucket) return false;
    const removed = bucket.delete(listener);
    if (bucket.size === 0) listeners.delete(type);
    return removed;
  }

  function emit(type, detail) {
    const bucket = listeners.get(type);
    if (!bucket) return 0;
    for (const listener of [...bucket]) listener(detail);
    return bucket.size;
  }

  function clear() { listeners.clear(); }

  return { on, once, off, emit, clear, listenerCount: (type) => listeners.get(type)?.size ?? 0 };
}
