// Separates camera-look input from the active world-space manipulation gesture.
export function createHoldGate() {
  let paused = false;
  return {
    pause() { paused = true; },
    resume() { paused = false; },
    get paused() { return paused; },
  };
}
