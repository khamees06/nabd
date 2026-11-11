// Runs the legacy ER room script (er.js) in a Node sandbox with a fake document, a fake clock and a fetch
// that can never reach the network. The golden masters of the clinical core are recorded through it.
//
// Which script and which data it loads:
//   NB_ER_JS   path of the er.js to run   (default: the frozen baseline in tests/Nabd.Tests/LegacyBaseline/site)
//   NB_DATA    folder holding er-cases.json, er-act.json, er-find.json
//              (default: src/Nabd.Infrastructure/LegacyData/Files)
// To check the script the ASP.NET Core host serves, save GET /js/er.js to a file and point NB_ER_JS at it.
const vm = require('vm'), fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const ER_JS = process.env.NB_ER_JS || path.join(REPO, 'tests/Nabd.Tests/LegacyBaseline/site/er.js');
const DATA = process.env.NB_DATA || path.join(REPO, 'src/Nabd.Infrastructure/LegacyData/Files');
const SRC = fs.readFileSync(ER_JS, 'utf8').replace(/\r\n/g, '\n');
const readData = name => fs.readFileSync(path.join(DATA, name), 'utf8');

// Seeded random numbers: the same seed gives the same room.
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

class El {
  constructor(id) {
    this.id = id; this.children = []; this.dataset = {}; this._txt = ''; this._html = ''; this.hidden = false; this.disabled = false; this.value = '';
    this.listeners = {}; this.scrollTop = 0; this.scrollHeight = 0; this.attrs = {}; this.className = ''; this.onclick = null;
    this.classList = { _s: new Set(), contains: x => this.classList._s.has(x), toggle: (x, v) => { if (v) this.classList._s.add(x); else this.classList._s.delete(x); }, add: x => this.classList._s.add(x), remove: x => this.classList._s.delete(x) };
  }
  set textContent(v) { this._txt = String(v); } get textContent() { return this._txt; }
  set innerHTML(v) { this._html = String(v); if (v === '') this.children = []; } get innerHTML() { return this._html; }
  appendChild(c) { this.children.push(c); c.parent = this; return c; }
  remove() { if (this.parent) { const i = this.parent.children.indexOf(this); if (i >= 0) this.parent.children.splice(i, 1); } }
  addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }
  focus() {} setAttribute(k, v) { this.attrs[k] = v; } getAttribute(k) { return this.attrs[k]; }
  querySelector() { return new El('q'); } querySelectorAll() { return []; } click() {}
}

class Room {
  // transform: optional function (source text) => source text, applied to er.js before it runs. The trace
  // recorder uses it to add recording hooks; the conversation golden master runs the script unchanged.
  constructor({ seed = 1, api = 'dead', hostname = 'khamees06.github.io', latency = 0, transform = null, globals = {} } = {}) {
    this.now = 1000; this.raf = null; this.rafId = 0; this.els = new Map(); this.errors = []; this.posts = []; this.deferred = []; this.mode = api; this.latency = latency; this.responder = null;
    const self = this;
    const get = id => { if (!self.els.has(id)) self.els.set(id, new El(id)); return self.els.get(id); };
    this.get = get;
    const doc = {
      hidden: false,
      getElementById: get,
      createElement: () => new El('div'),
      querySelector: sel => { const k = 'qs:' + sel; if (sel === '.er-mon') return null; return get(k); },
      querySelectorAll: () => [],
    };
    const sandbox = {
      document: doc, console: { error: (...a) => self.errors.push(a.map(x => (x && x.stack) || String(x)).join(' ')), warn: () => {}, log: console.log },
      location: { hostname, protocol: 'https:', search: '' }, URLSearchParams,
      performance: { now: () => self.now },
      requestAnimationFrame: f => { self.raf = f; return ++self.rafId; },
      cancelAnimationFrame: () => { self.raf = null; },
      AbortSignal: { timeout: ms => ({ ms }) },
      fetch: (url, opt) => self.fetch(url, opt),
      setTimeout, clearTimeout,
      ...globals,
    };
    sandbox.window = sandbox;
    this.ctx = vm.createContext(sandbox);
    this.rand = mulberry(seed);
    sandbox.__rand = this.rand;
    vm.runInContext('Math.random = __rand;', this.ctx);
    vm.runInContext(transform ? transform(SRC) : SRC, this.ctx, { filename: 'er.js' });
    this.win = sandbox;
    this.N = sandbox.__nbER;
    get('view-er').dataset.stage = 'calm';
  }
  // Every request the room makes is decided here; nothing reaches the network.
  fetch(url, opt) {
    const file = /(?:^|\/)data\/(er-cases|er-act|er-find)\.json$/.exec(url);
    if (file) { try { const text = readData(file[1] + '.json'); return Promise.resolve({ ok: true, json: async () => JSON.parse(text) }); } catch (e) { return Promise.reject(e); } }
    if (/ping=/.test(url)) return this.responder ? Promise.resolve({ ok: true }) : Promise.reject(new TypeError('Failed to fetch (stub dead)'));
    const body = JSON.parse(opt.body);
    this.posts.push({ at: this.now, simAt: this.E ? this.E.sim : 0, body });
    const ms = (opt.signal && opt.signal.ms) || 15000;
    if (this.responder) {
      const out = this.responder(body, this);
      if (out && out.hang) return new Promise((res, rej) => { this.deferred.push({ at: this.now + ms, fn: () => rej(new Error('timeout')) }); });
      if (out && out.after != null) return new Promise((res, rej) => { this.deferred.push({ at: this.now + Math.min(out.after, ms), fn: () => (out.after > ms ? rej(new Error('timeout')) : res(out.res)) }); });
      if (out && out.reject) return Promise.reject(new Error(out.reject));
      return Promise.resolve(out);
    }
    return Promise.reject(new TypeError('Failed to fetch (stub dead)'));
  }
  get E() { return this.N.E; }
  // The real entry path, then the requested case. opts.role = 'nurse' opens the nurse room (default: doctor).
  async open(id, opts = {}) {
    this.N.role = opts.role || null;
    this.get('view-er');
    await this.win.nbOpenER();
    await this.tickle();
    if (id) this.N.begin(id);
    await this.tickle();
    return this;
  }
  async tickle(n = 12) { for (let i = 0; i < n; i++) await new Promise(r => setImmediate(r)); }
  // One animation frame, ms milliseconds after the previous one.
  frame(ms) {
    this.now += ms;
    for (const d of this.deferred.filter(x => x.at <= this.now)) { this.deferred.splice(this.deferred.indexOf(d), 1); d.fn(); }
    const f = this.raf; this.raf = null; if (f) f(this.now);
  }
  async real(seconds, step = 100) { const n = Math.round(seconds * 1000 / step); for (let i = 0; i < n; i++) { this.frame(step); if (i % 5 === 0) await this.tickle(2); } await this.tickle(); }
  async simTo(min) { let g = 0; while (this.E.sim < min && !this.E.over && g++ < 200000) { this.frame(100); if (g % 5 === 0) await this.tickle(2); } await this.tickle(); }
  async say(text, gap = 0) {
    const before = this.feedLen();
    this.N.send(text);
    await this.tickle();
    if (gap) await this.real(gap);
    return this.feed().slice(before);
  }
  feedEl() { return this.get('er-feed'); }
  feedLen() { return this.feedEl().children.length; }
  feed() { return this.feedEl().children.map(c => ({ k: c.className.replace('er-msg ', ''), t: (c.innerHTML || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() })); }
  // Hands over through the real sheet code.
  async handover({ dx, dispo, sbar }) {
    this.get('er-end').listeners.click[0]();
    this.get('er-dx').value = dx; this.get('er-dispo').value = dispo; this.get('er-sbar').value = sbar;
    await this.get('er-end-go').onclick();
    await this.tickle();
  }
  debrief() { return this.get('er-debrief').innerHTML.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
}
module.exports = { Room, mulberry, REPO, ER_JS, DATA };
