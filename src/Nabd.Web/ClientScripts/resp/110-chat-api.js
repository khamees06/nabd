  // The patient speaks through Claude on the Vercel site; the GitHub Pages copy and the local test
  // server call the same endpoint across origins. Without a key (404/405/503) or across two failures
  // in a row it is switched off, and the room answers from its table.
  let api = location.protocol === 'file:' ? 'off' : 'try';
  let apiFails = 0;
  async function chatApi(text) {
    if (api === 'off') return null;
    try {
      const r = await fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          text, history: S.chat.slice(0, -1).slice(-12), facts: S.facts, chief: S.pt.init,
          patient: { age: S.pt.age, sex: S.pt.sex, name: S.name, speaker: young() ? 'mother' : 'self' }
        })
      });
      if (!r.ok) {
        if ([403, 404, 405, 503].includes(r.status) || ++apiFails >= 2) api = 'off';
        return null;
      }
      const j = await r.json();
      if (typeof j.reply !== 'string' || !j.reply.trim()) return null;
      api = 'on'; apiFails = 0;
      return { ids: (Array.isArray(j.ids) ? j.ids : []).filter(id => evIndex[id] != null), reply: j.reply.trim() };
    } catch (e) {
      if (++apiFails >= 2) api = 'off';
      return null;
    }
  }

