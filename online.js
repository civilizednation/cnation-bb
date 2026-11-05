'use strict';

// ───────────────────────── 온라인 랭킹 (Firebase Firestore) ─────────────────────────
// cnation-jgame과 같은 Firebase 프로젝트(cnation-project)를 쓴다.
// SDK(수백 KB)를 받지 않고 Firestore REST API를 바로 부른다: 첫 로딩이 가볍다.
// 기록은 한 건씩 따로 저장한다(문서 하나에 배열로 덮어쓰지 않음): 동시에 올려도 서로 덮지 않는다.
// 프로젝트 규칙은 기존 그대로(모든 컬렉션 열림) 쓴다. 더 막을 때 쓸 규칙: docs/firestore.rules
// apiKey는 공개돼도 되는 값이다(접근 제어는 보안 규칙이 한다).
const Online = (() => {
  const API_KEY = 'AIzaSyCTwOAC_LrrKH8CKepUOTf0pyd9qRv4y_8';
  const PROJECT = 'cnation-project';
  const DOCS = `projects/${PROJECT}/databases/(default)/documents`;
  const BASE = `https://firestore.googleapis.com/v1/${DOCS}`;
  // 3분 챌린지는 v1.5.3부터 점수제라 새 컬렉션(-v2)으로 새로 시작한다
  const COL = { story: 'cnation-bb-rank-story', bean: 'cnation-bb-rank-bean-v2', mix: 'cnation-bb-rank-mix-v2' };
  const TIMEOUT = 8000;

  // board → 상위 10건 (마지막으로 받은 것). 기기에도 남겨 두어, 인터넷이 안 될 때 보여 준다
  const STORE_KEY = 'cnation-bb-online-cache-v2';
  const cache = {}, savedAt = {};
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    for (const b of Object.keys(COL)) {
      const e = s[b];
      if (!e || !Array.isArray(e.list)) continue;
      // 기기에 남긴 것도 남이 쓴 기록이다: 모양을 다시 확인한다
      cache[b] = e.list.filter((r) => r && typeof r.name === 'string' && Number.isFinite(r.money)).slice(0, 10);
      savedAt[b] = Number(e.at) || 0;
    }
  } catch { /* 무시 */ }
  function remember(board, list) {
    cache[board] = list;
    savedAt[board] = Date.now();
    try {
      const s = {};
      for (const b of Object.keys(cache)) s[b] = { list: cache[b], at: savedAt[b] };
      localStorage.setItem(STORE_KEY, JSON.stringify(s));
    } catch { /* 무시 */ }
  }

  async function call(url, body) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), TIMEOUT);
    try {
      const r = await fetch(`${url}?key=${API_KEY}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: ctl.signal,
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } finally { clearTimeout(t); }
  }

  // Firestore 값 ↔ JS 값
  const enc = (v) => typeof v === 'boolean' ? { booleanValue: v }
    : Number.isInteger(v) ? { integerValue: String(v) } : { stringValue: String(v) };
  function dec(f) {
    if (!f) return undefined;
    if ('integerValue' in f) return Number(f.integerValue);
    if ('doubleValue' in f) return Number(f.doubleValue);
    if ('booleanValue' in f) return f.booleanValue;
    if ('stringValue' in f) return f.stringValue;
    return undefined;
  }
  // 받은 기록은 남이 쓴 것이다: 모양이 맞는 것만 쓰고, 화면에는 글자로만 넣는다(escapeHtml)
  function clean(doc) {
    const f = doc.fields || {}, o = {};
    for (const k of Object.keys(f)) o[k] = dec(f[k]);
    if (typeof o.name !== 'string' || !Number.isFinite(o.money)) return null;
    return {
      id: doc.name.split('/').pop(), name: o.name.slice(0, 8), money: o.money,
      sold: Number.isFinite(o.sold) ? o.sold : 0, net: Number.isFinite(o.net) ? o.net : undefined, sat: Number.isFinite(o.sat) ? o.sat : undefined,
      ending: typeof o.ending === 'string' ? o.ending.slice(0, 20) : '', retry: o.retry === true,
      date: typeof o.date === 'string' ? o.date.slice(0, 10) : '',
    };
  }

  // 판별 상위 10건
  async function top(board) {
    const rows = await call(`${BASE}:runQuery`, { structuredQuery: {
      from: [{ collectionId: COL[board] }],
      orderBy: [{ field: { fieldPath: 'money' }, direction: 'DESCENDING' }],
      limit: 10,
    } });
    const list = rows.filter((r) => r.document).map((r) => clean(r.document)).filter(Boolean);
    remember(board, list);
    return list;
  }

  // 기록 한 건 추가. 성공하면 문서 id를 돌려준다
  async function add(board, entry) {
    const id = Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => b.toString(16).padStart(2, '0')).join('');
    const fields = {};
    for (const k of ['name', 'money', 'net', 'sold', 'sat', 'ending', 'retry', 'date']) {
      if (entry[k] !== undefined && entry[k] !== null) fields[k] = enc(entry[k]);
    }
    await call(`${BASE}:commit`, { writes: [{
      update: { name: `${DOCS}/${COL[board]}/${id}`, fields },
      currentDocument: { exists: false },
      updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
    }] });
    // 바로 다시 못 받아도 내 기록이 보이게, 받아 둔 목록에 넣어 둔다
    const list = (cache[board] || []).concat({ id, ...entry }).sort((a, b) => b.money - a.money).slice(0, 10);
    remember(board, list);
    return id;
  }

  // 온라인 10위 안에 드는지 (마지막으로 받은 목록 기준, 모르면 null)
  function qualifies(board, money) {
    const c = cache[board];
    if (!c) return null;
    return c.length < 10 || money > c[c.length - 1].money;
  }

  // 로딩 화면이 끝난 뒤 뒤에서 세 판을 미리 받아 둔다 (실패해도 조용히)
  function preload() { Object.keys(COL).forEach((b) => top(b).catch(() => {})); }

  return { top, add, qualifies, preload, cached: (b) => cache[b], savedAt: (b) => savedAt[b] || 0 };
})();
