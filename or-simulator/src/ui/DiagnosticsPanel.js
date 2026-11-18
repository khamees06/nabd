import { PerformanceMonitor } from '../core/PerformanceMonitor.js';

/** Opt-in developer-only overlay. It is absent unless ?debug=1 is present. */
export function createDiagnosticsPanel({ host, enabled = false, eventBus = null }) {
  if (!enabled || !host) return { enabled: false, update() {}, dispose() {} };
  const monitor = new PerformanceMonitor();
  const panel = document.createElement('aside');
  panel.className = 'nabd-diagnostics';
  panel.setAttribute('aria-label', 'Developer diagnostics');
  panel.innerHTML = '<strong>NABD · DEV</strong><span data-metric="fps">FPS —</span><span data-metric="frame">Frame —</span><span data-metric="draw">Draw —</span><span data-metric="triangles">Triangles —</span><span data-metric="assets">Geo — · Tex —</span><span data-metric="events">Events 0</span>';
  host.append(panel);
  const fields = Object.fromEntries([...panel.querySelectorAll('[data-metric]')].map((node) => [node.dataset.metric, node]));
  let eventCount = 0;
  const unsubscribe = eventBus?.on('simulation:event', () => {
    eventCount += 1;
    fields.events.textContent = `Events ${eventCount}`;
  });
  let lastUiUpdate = 0;

  function update(timestamp, rendererInfo, frameSeconds) {
    const metrics = monitor.sample(timestamp, rendererInfo, frameSeconds, performance.memory);
    if (timestamp - lastUiUpdate < 450) return metrics;
    lastUiUpdate = timestamp;
    fields.fps.textContent = `FPS ${metrics.fps}`;
    fields.frame.textContent = `Frame ${metrics.frameMs} ms`;
    fields.draw.textContent = `Draw ${metrics.calls}`;
    fields.triangles.textContent = `Triangles ${metrics.triangles.toLocaleString()}`;
    fields.assets.textContent = `Geo ${metrics.geometries} · Tex ${metrics.textures}`;
    return metrics;
  }
  function dispose() { unsubscribe?.(); panel.remove(); }
  return { enabled: true, update, dispose, panel };
}
