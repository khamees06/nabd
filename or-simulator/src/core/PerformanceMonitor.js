/** Low-overhead rolling FPS and renderer metrics sampler. */
export class PerformanceMonitor {
  constructor({ sampleWindowMs = 500, now = () => performance.now() } = {}) {
    this.sampleWindowMs = sampleWindowMs;
    this.now = now;
    this.windowStart = null;
    this.frames = 0;
    this.fps = 0;
    this.frameMs = 0;
    this.lastSampleAt = 0;
  }

  sample(timestamp, rendererInfo, frameMs = 0, memory = null) {
    this.frames += 1;
    if (this.windowStart == null) this.windowStart = timestamp;
    this.frameMs = frameMs * 1000;
    if (timestamp - this.windowStart >= this.sampleWindowMs) {
      this.fps = this.frames * 1000 / Math.max(1, timestamp - this.windowStart);
      this.frames = 0;
      this.windowStart = timestamp;
      this.lastSampleAt = timestamp;
    }
    const render = rendererInfo?.render ?? {};
    const rendererMemory = rendererInfo?.memory ?? {};
    return {
      fps: Math.round(this.fps),
      frameMs: Number(this.frameMs.toFixed(1)),
      calls: Number(render.calls ?? 0),
      triangles: Number(render.triangles ?? 0),
      points: Number(render.points ?? 0),
      lines: Number(render.lines ?? 0),
      geometries: Number(rendererMemory.geometries ?? 0),
      textures: Number(rendererMemory.textures ?? 0),
      programs: Array.isArray(rendererInfo?.programs) ? rendererInfo.programs.length : null,
      heapUsedMB: Number.isFinite(memory?.usedJSHeapSize) ? memory.usedJSHeapSize / 1048576 : null,
    };
  }
}
