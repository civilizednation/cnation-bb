'use strict';

// ───────────────────────── 스토리 모드 (1단계) ─────────────────────────
// 겨울 보름(Day 1~15) 동안 손님 만족도를 지키며 돈을 모은다. 기획: docs/story-mode-plan.md
// 1단계 범위: 팥만, 손님은 한 명씩. (줄 서기·슈크림·종류별 봉투는 2단계)
// game.js의 전역(cfg, money, stats, startDay, playBgm, ...)을 함께 쓴다.

const Story = (() => {
  // ── 날짜별 난이도 (기획안 2장, 초기값) ──
  // len: 장사 시간(초), arrive: 손님 간격(초, 2단계 줄 서기 기준), patience: 인내심(초), need: 주문 개수 [최소, 최대]
  // 1단계는 손님이 한 명씩 오므로, "손님이 떠나고 다음 손님이 오기까지"를 손님 간격의 35%로 쓴다.
  const DAYS = [
    null,
    { len: 45, arrive: [7, 9], patience: 38, need: [1, 2] },
    { len: 50, arrive: [6, 8], patience: 36, need: [1, 2] },
    { len: 55, arrive: [6, 7], patience: 34, need: [1, 3] },
    { len: 55, arrive: [5, 7], patience: 33, need: [1, 3] },
    { len: 60, arrive: [5, 6], patience: 32, need: [1, 3] },
    { len: 60, arrive: [5, 6], patience: 31, need: [1, 3] },
    { len: 65, arrive: [4.5, 5.5], patience: 30, need: [1, 3] },
    { len: 65, arrive: [4.5, 5.5], patience: 29, need: [1, 4] },
    { len: 70, arrive: [4, 5], patience: 28, need: [1, 4] },
    { len: 70, arrive: [4, 5], patience: 27, need: [2, 4] },
    { len: 70, arrive: [4, 4.5], patience: 26, need: [2, 4] },
    { len: 75, arrive: [3.5, 4.5], patience: 25, need: [2, 4] },
    { len: 75, arrive: [3.5, 4], patience: 24, need: [2, 5] },
    { len: 75, arrive: [3, 4], patience: 23, need: [2, 5] },
    { len: 80, arrive: [3, 3.5], patience: 22, need: [2, 5] },
  ];
  const LAST_DAY = 15;
  const GAP_RATIO = 0.2;

  // 하루 시작 이야기 (기획안 10장). 1단계에는 슈크림이 없어서 Day 4·8은 1단계용 문구를 쓴다.
  const STORY = [
    null,
    '눈 내리는 골목에 작은 붕어빵 가게를 열었다. 오늘은 첫날, 천천히 해 보자!',
    '어제 왔던 손님이 친구를 데려왔다! 손님이 늘 것 같아 철판을 바꿨다. 이제 틀이 6개다.',
    '동네 아이들이 학교 끝나고 들르기 시작했다.',
    '단골이 될 것 같은 손님이 생겼다. 내일도 꼭 온다고 했다!',
    '동네 철물점 아저씨가 큰 철판을 달아 주셨다. 틀이 9개가 됐다!',
    '옆 골목에서도 우리 가게 이야기를 한다는데…?',
    '주말이다! 아침부터 손님들이 줄을 섰다.',
    '주말이 지나도 손님이 줄지 않는다. 장사가 본격적으로 바빠진다!',
    '단골손님이 생겼다. 이름도 기억해 주신다.',
    '보름의 절반이 지났다. 지금까지 잘해 왔어!',
    '한파 주의보! 몸 녹이러 오는 손님들로 북적인다.',
    '동네 신문에 우리 가게가 실렸다. 오늘은 더 바빠질 것 같다.',
    '손이 빨라졌다. 이제 철판 소리만 들어도 언제 뒤집을지 안다.',
    '마지막 주말. 동네 사람들이 모두 들르는 것 같다.',
    '보름의 마지막 날. 오늘을 최고의 하루로 만들자!',
  ];

  // 틀은 상점이 아니라 날짜에 따라 늘어난다: Day 1 4칸, Day 2 6칸, Day 5 9칸
  function moldsFor(day) {
    if (day >= 5) return ALL_MOLDS;
    if (day >= 2) return [0, 1, 2, 3, 4, 5];
    return [0, 1, 3, 4];
  }
  function moldCount(day) { return moldsFor(day).length; }

  // 굽는 속도는 날짜에 따라 빨라진다 (Day 1 → 15)
  const lerp = (a, b, day) => a + (b - a) * (day - 1) / (LAST_DAY - 1);
  const baseCook = (day) => lerp(6.0, 4.5, day);
  const baseBurn = (day) => lerp(6.5, 4.5, day);

  // ── 상점 (기획안 3장) ──
  // day: 이 날의 장사부터 쓸 수 있다 (그 전날 장사가 끝난 뒤 상점에 나온다)
  const UPGRADES = [
    { id: 'fire', icon: '🔥', name: '화력 강화', prices: [6000, 14000, 26000], day: 1 },
    { id: 'plate', icon: '🧯', name: '두꺼운 철판', prices: [5000, 12000], day: 1 },
    { id: 'bag', icon: '🛍️', name: '큰 봉투', prices: [4000, 10000], day: 3 },
    { id: 'sign', icon: '📯', name: '간판', prices: [8000, 20000], day: 8, hard: true },
    { id: 'price', icon: '💰', name: '가격 인상', prices: [10000, 24000], day: 8, hard: true },
  ];
  const BAG_SIZES = [6, 9, 12];
  const PRICES = [1000, 1200, 1400];
  const fx = {
    cook: (u) => 1 - 0.1 * (u.fire || 0),
    burn: (u) => 1 + 0.2 * (u.plate || 0),
    bag: (u) => BAG_SIZES[u.bag || 0],
    gap: (u) => 1 - 0.15 * (u.sign || 0),
    price: (u) => PRICES[u.price || 0],
    patience: (u) => 1 - 0.1 * (u.price || 0),
  };
  const sec = (v) => `${v.toFixed(1)}초`;
  const won = (v) => `${Math.round(v).toLocaleString()}원`;
  function effectText(id, lv, day) {
    switch (id) {
      case 'fire': return `한 면 굽는 시간 ${sec(baseCook(day) * (1 - 0.1 * lv))}`;
      case 'plate': return `타기까지 ${sec(baseBurn(day) * (1 + 0.2 * lv))}`;
      case 'bag': return `봉투에 ${BAG_SIZES[lv]}개까지`;
      case 'sign': return lv ? `손님이 ${15 * lv}% 더 자주 와요` : '손님이 오는 빠르기 그대로';
      case 'price': return lv ? `붕어빵 ${won(PRICES[lv])} · 손님 인내심 −${10 * lv}%` : `붕어빵 ${won(PRICES[0])}`;
    }
    return '';
  }

  // ── 만족도 (기획안 4장) ──
  const SAT = { start: 80, fast: 3, normal: 1, combo: 1, perfect: 1, leave: -8, burn: -1 };

  // ── 저장 (기획안 9장: 보내 주신 저장 코드를 이 게임에 맞게 고친 것) ──
  const SAVE_KEY = 'cnation-bb-story-v1', DB = 'cnation-bb-saves', STORE = 'slots', SAVE_VERSION = 1;
  const RANK_KEY = 'cnation-bb-story-rank-v1';
  const fresh = () => ({
    version: SAVE_VERSION, day: 1, money: 0, satisfaction: SAT.start,
    upgrades: { fire: 0, plate: 0, bag: 0, sign: 0, price: 0 },
    retryUsed: false, retryDay: 0, gameOver: false,
    stats: { sold: 0, missed: 0, burnt: 0 }, savedAt: 0,
  });
  function validSave(s) {
    if (!s || s.version !== SAVE_VERSION) return false;
    if (!Number.isInteger(s.day) || s.day < 1 || s.day > LAST_DAY) return false;
    if (!Number.isFinite(s.money)) return false;
    if (!Number.isFinite(s.satisfaction) || s.satisfaction < 0 || s.satisfaction > 100) return false;
    if (typeof s.retryUsed !== 'boolean' || !Number.isInteger(s.retryDay)) return false;
    if (!s.upgrades || typeof s.upgrades !== 'object') return false;
    return UPGRADES.every((u) => {
      const lv = s.upgrades[u.id] ?? 0;
      return Number.isInteger(lv) && lv >= 0 && lv <= u.prices.length;
    });
  }
  function normalizeSave(s) {
    s.upgrades = Object.assign(fresh().upgrades, s.upgrades);
    s.stats ??= { sold: 0, missed: 0, burnt: 0 };
    s.gameOver = !!s.gameOver;
    /* 이전 형식 변환은 여기에 */
    return s;
  }
  function openDB() {
    return new Promise((ok, no) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' });
      r.onsuccess = () => ok(r.result);
      r.onerror = () => no(r.error);
    });
  }
  async function idb(mode, id, rec) {
    const db = await openDB();
    try {
      return await new Promise((ok, no) => {
        const tx = db.transaction(STORE, mode === 'get' ? 'readonly' : 'readwrite'), st = tx.objectStore(STORE);
        const q = mode === 'get' ? st.get(id) : mode === 'del' ? st.delete(id) : st.put(rec);
        let v;
        q.onsuccess = () => { v = q.result; };
        tx.oncomplete = () => ok(v);
        tx.onerror = () => no(tx.error);
      });
    } finally { db.close(); }
  }
  function readSave() {
    let raw;
    try { raw = localStorage.getItem(SAVE_KEY); } catch { return { kind: 'unavailable' }; }
    if (raw === null) return { kind: 'empty' };
    try {
      const d = JSON.parse(raw);
      return validSave(d) ? { kind: 'valid', data: normalizeSave(d) } : { kind: 'invalid', raw };
    } catch { return { kind: 'invalid', raw }; }
  }
  let save = null;           // 지금 진행 중인 스토리 (그날 아침 상태). 없으면 null
  function persist() {
    if (!save) return;
    save.savedAt = Date.now();
    const json = JSON.stringify(save);
    try { localStorage.setItem(SAVE_KEY, json); } catch { notice('저장하지 못했어요. 저장 공간을 확인해 주세요.'); }
    if (window.indexedDB) idb('put', null, { id: 'auto', json, savedAt: save.savedAt }).catch(() => {});
  }
  function clearSave() {
    save = null;
    try { localStorage.removeItem(SAVE_KEY); } catch { /* 무시 */ }
    if (window.indexedDB) idb('del', 'auto').catch(() => {});
  }
  // localStorage가 지워졌거나 IndexedDB 쪽이 더 최근이면 IndexedDB 사본으로 되살린다
  async function restoreNewer() {
    if (!window.indexedDB) return;
    try {
      const m = await idb('get', 'auto');
      if (!m?.json) return;
      const mirror = JSON.parse(m.json), r = readSave();
      if (!validSave(mirror)) return;
      if (r.kind !== 'valid' || r.data.savedAt < mirror.savedAt) localStorage.setItem(SAVE_KEY, m.json);
    } catch { /* 무시: localStorage 저장이 기준 */ }
  }
  async function boot() {
    await restoreNewer();
    const r = readSave();
    if (r.kind === 'valid') save = r.data;
    else if (r.kind === 'invalid') {
      // 망가진 저장은 지우지 않고 따로 옮겨 둔다 (나중에 꺼내 볼 수 있게)
      try { localStorage.setItem(SAVE_KEY + '-broken', r.raw); localStorage.removeItem(SAVE_KEY); } catch { /* 무시 */ }
    }
    refreshTitle();
  }
  // 화면을 벗어날 때도 아침 상태를 한 번 더 저장해 둔다 (장사 중 상태는 저장하지 않는다)
  addEventListener('pagehide', persist);

  // ── 진행 중인 하루 ──
  let today = null;          // { day, startMoney, satStart, sat, combo, fast, served, left, burnt, perfect }

  function buildCfg(day, u) {
    const d = DAYS[day];
    const rand = (a, b) => a + Math.random() * (b - a);
    return {
      dayLength: d.len,
      price: fx.price(u),
      bagMax: fx.bag(u),
      molds: moldsFor(day),
      cook: () => baseCook(day) * fx.cook(u),
      burn: () => baseBurn(day) * fx.burn(u),
      patience: () => d.patience * fx.patience(u),
      need: () => d.need[0] + Math.floor(Math.random() * (d.need[1] - d.need[0] + 1)),
      gap: () => rand(d.arrive[0], d.arrive[1]) * GAP_RATIO * fx.gap(u),
      firstGap: 1.5,
    };
  }

  const $s = (id) => document.getElementById(id);
  ['story-menu', 'story-confirm', 'story-intro', 'story-result', 'shop', 'gameover', 'ending', 'ranking', 'story-notice']
    .forEach((id) => SCREENS.push(id));
  function show(id) { hideScreens(); $s(id).classList.remove('hidden'); }

  // ── 타이틀의 스토리 모드 메뉴 ──
  function refreshTitle() {
    const has = !!save;
    $s('story-continue').classList.toggle('hidden', !has);
    if (has) {
      $s('story-continue-info').textContent = save.gameOver
        ? `Day ${save.day} · 게임 오버 상태`
        : `Day ${save.day} · ${won(save.money)} · 만족도 ${Math.round(save.satisfaction)}%`;
    }
  }
  function openMenu() { refreshTitle(); show('story-menu'); }
  function newStory() {
    if (save) { show('story-confirm'); return; }
    beginNew();
  }
  function beginNew() {
    save = fresh();
    persist();
    showIntro();
  }
  function continueStory() {
    if (!save) return;
    if (save.gameOver) return showGameOver();
    showIntro();
  }

  // ── 하루 시작: 이야기 ──
  // 그날 아침 가게 모습으로 정리한다 (전날 마지막 손님·틀 상태가 이야기 화면 뒤에 남지 않게)
  function prepareScene(day) {
    mode = 'story';
    cfg = buildCfg(day, save.upgrades);
    document.body.classList.add('story-mode');
    running = false;
    elapsed = 0;
    money = save.money;
    bagCount = 0;
    bagPerfect = [];
    customer = null;
    Object.keys(stats).forEach((k) => { stats[k] = 0; });
    const before = day > 1 ? moldsFor(day - 1) : cfg.molds;
    molds.forEach((m, i) => { setMold(m, 'empty'); m.flipAt = -1; m.locked = !before.includes(i); });
  }
  function showIntro() {
    const day = save.day;
    prepareScene(day);
    $s('intro-day').textContent = `Day ${day}`;
    $s('intro-text').textContent = STORY[day];
    const extra = [];
    if (save.retryDay === day) extra.push('다시 하는 날이에요. 오늘 순이익의 50%는 재기 비용으로 반납해요.');
    if (day === 2 || day === 5) extra.push(`🔓 틀이 ${moldCount(day)}개로 늘었어요!`);
    $s('intro-extra').textContent = extra.join('\n');
    show('story-intro');
    playBgm('title');
  }
  function beginDay() {
    const day = save.day;
    mode = 'story';
    cfg = buildCfg(day, save.upgrades);
    today = { day, startMoney: save.money, satStart: save.satisfaction, sat: save.satisfaction,
      combo: 0, fast: 0, served: 0, left: 0, burnt: 0, perfect: 0 };
    const before = day > 1 ? moldsFor(day - 1) : [];
    startDay(save.money);
    // 새로 열린 틀은 반짝 연출
    if (day === 2 || day === 5) molds.forEach((m, i) => {
      if (cfg.molds.includes(i) && !before.includes(i)) {
        m.el.classList.remove('unlocking'); void m.el.offsetWidth; m.el.classList.add('unlocking');
      }
    });
    toast(`Day ${day} 장사 시작!`);
  }

  // ── 장사 중 만족도 ──
  function changeSat(delta) {
    if (!today) return;
    today.sat = Math.max(0, Math.min(100, today.sat + delta));
    if (today.sat <= 0 && running) gameOver();
  }
  function onServed(ratio, allPerfect) {
    today.served++;
    today.combo++;
    let d = ratio > 0.7 ? SAT.fast : SAT.normal;
    if (ratio > 0.7) today.fast++;
    if (today.combo >= 3) { d += SAT.combo; setTimeout(() => toast(`🔥 ${today.combo}콤보! 만족도 +${d}`), 650); }
    if (allPerfect) { d += SAT.perfect; today.perfect++; }
    changeSat(d);
  }
  function onMissed() { today.left++; today.combo = 0; changeSat(SAT.leave); }
  function onBurnt() { today.burnt++; changeSat(SAT.burn); }

  function renderHud() {
    const v = today ? today.sat : save ? save.satisfaction : SAT.start;
    $s('sat-text').textContent = Math.round(v);
    $s('sat-face').textContent = v >= 70 ? '😊' : v >= 40 ? '😐' : '😟';
    const f = $s('sat-fill');
    f.style.width = `${v}%`;
    f.style.background = v >= 70 ? '#5dbb63' : v >= 40 ? '#f5a623' : '#e74c3c';
  }

  // ── 하루 끝: 정산 → 상점 ──
  function endDay() {
    const day = today.day;
    const net = money - today.startMoney;
    const retryCost = save.retryDay === day && net > 0 ? Math.round(net * 0.5 / 10) * 10 : 0;
    money -= retryCost;
    const row = (label, value, cls = '') => `<div class="row ${cls}"><span>${label}</span><b>${value}</b></div>`;
    const satDiff = Math.round(today.sat) - Math.round(today.satStart);
    $s('sr-title').textContent = `Day ${day} 장사 정산`;
    $s('sr-rows').innerHTML = [
      row('판매한 붕어빵', `${stats.sold}개`),
      row('판매 매출', `+${won(stats.sales)}`, 'plus'),
      row('손님 팁', `+${won(stats.tips)}`, 'plus'),
      row(`재료비 (반죽 1회 ${won(BATTER_COST)})`, `-${won(stats.cost)}`, 'minus'),
      retryCost ? row('재기 비용 (오늘 순이익의 50%)', `-${won(retryCost)}`, 'minus') : '',
      '<hr>',
      row('오늘 순이익', won(net - retryCost), 'total'),
      row('가진 돈', won(money)),
      row('손님 만족도', `${Math.round(today.satStart)}% → ${Math.round(today.sat)}% (${satDiff >= 0 ? '+' : ''}${satDiff})`),
      row('빠른 제공 · 떠난 손님 · 탄 붕어빵', `${today.fast}번 · ${today.left}명 · ${today.burnt}개`),
    ].join('');
    // 아침 상태를 다음 날 것으로 바꿔서 저장한다 (정산을 끝낸 뒤에 앱을 꺼도 그날 결과가 남게)
    save.money = money;
    save.satisfaction = today.sat;
    save.stats.sold += stats.sold; save.stats.missed += stats.missed; save.stats.burnt += stats.burnt;
    if (save.retryDay === day) save.retryDay = 0;
    const finished = day >= LAST_DAY;
    if (!finished) save.day = day + 1;
    save.finished = finished;
    persist();
    $s('sr-next').textContent = finished ? '엔딩 보기' : '상점으로';
    today = null;
    mode = 'challenge'; cfg = CHALLENGE;   // 장사 밖에서는 3분 챌린지 설정으로 돌려 둔다
    show('story-result');
  }
  function afterResult() {
    if (save?.finished) return showEnding();
    showShop();
  }

  function showShop() {
    const next = save.day;   // 다음에 장사할 날
    $s('shop-money').textContent = won(save.money);
    $s('shop-next').textContent = `Day ${next} 장사하러 가기`;
    $s('shop-list').innerHTML = UPGRADES.map((u) => {
      const lv = save.upgrades[u.id] || 0;
      const max = u.prices.length;
      const open = next >= u.day;
      const isNew = open && next === u.day && u.day > 1;
      const dots = Array.from({ length: max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
      let action, effect;
      if (!open) {
        action = `<span class="shop-wait">Day ${u.day}에 열려요</span>`;
        effect = effectText(u.id, 1, u.day);
      } else if (lv >= max) {
        action = '<span class="shop-max">최고 단계</span>';
        effect = effectText(u.id, lv, next);
      } else {
        const price = u.prices[lv];
        const short = save.money < price;
        action = `<button class="shop-buy" data-id="${u.id}" ${short ? 'disabled' : ''}>${won(price)}${short ? `<small>${won(price - save.money)} 부족</small>` : ''}</button>`;
        effect = `${effectText(u.id, lv, next)} → <b>${effectText(u.id, lv + 1, next)}</b>`;
      }
      return `<div class="shop-item ${open ? '' : 'closed'}">
        <div class="shop-icon">${u.icon}</div>
        <div class="shop-body">
          <div class="shop-name">${u.name}${u.hard ? '<em class="hard">자신 있을 때</em>' : ''}${isNew ? '<em class="new">NEW</em>' : ''}</div>
          <div class="shop-dots">${dots}</div>
          <div class="shop-effect">${effect}</div>
        </div>
        <div class="shop-action">${action}</div>
      </div>`;
    }).join('');
    show('shop');
  }
  function buy(id) {
    const u = UPGRADES.find((x) => x.id === id);
    const lv = save.upgrades[id] || 0;
    if (!u || lv >= u.prices.length || save.money < u.prices[lv]) return;
    save.money -= u.prices[lv];
    save.upgrades[id] = lv + 1;
    persist();
    play('collect');
    showShop();
  }

  // ── 게임 오버 · 다시 하기 (기획안 8장) ──
  function gameOver() {
    running = false;
    playBgm(null);
    play('sad');
    today = null;
    mode = 'challenge'; cfg = CHALLENGE;
    save.gameOver = true;   // 그냥 나갔다 와도 게임 오버 화면부터 다시 보이게
    persist();
    showGameOver();
  }
  function showGameOver() {
    const canRetry = !save.retryUsed;
    $s('go-text').textContent = canRetry
      ? '손님들이 발길을 끊었어요… 가게 문을 닫았습니다.'
      : '다시 하기를 이미 써서, 이번 스토리는 여기서 끝났어요.';
    $s('go-retry-info').classList.toggle('hidden', !canRetry);
    $s('go-retry').classList.toggle('hidden', !canRetry);
    $s('go-new').classList.toggle('hidden', canRetry);
    $s('go-home').textContent = canRetry ? '처음 화면으로' : '처음 화면으로';
    if (!canRetry) clearSave();   // 이 기록은 랭킹에 올라가지 않는다
    show('gameover');
  }
  function retry() {
    // 그날 아침 상태(저장된 돈·업그레이드·만족도)로 되돌아가서 다시 한다
    const r = readSave();
    if (r.kind === 'valid') save = r.data;
    save.retryUsed = true;
    save.retryDay = save.day;
    save.gameOver = false;
    persist();
    showIntro();
  }

  // ── 엔딩 · 랭킹 (기획안 8장) ──
  const ENDINGS = [
    { min: 90, key: 'star', title: '⭐ 동네 명물 엔딩', text: '줄 서서 먹는 집이 되었어요! 동네 사람 모두가 우리 붕어빵을 기억해요.' },
    { min: 60, key: 'regular', title: '단골 가게 엔딩', text: '손님들이 내년 겨울에도 꼭 와 달래요.' },
    { min: 0, key: 'survive', title: '무사 완주 엔딩', text: '힘들었지만 보름을 끝까지 버텼어요.' },
  ];
  let ending = null;
  function showEnding() {
    const sat = save.satisfaction;
    const e = ENDINGS.find((x) => sat >= x.min);
    ending = { money: save.money, sat: Math.round(sat), key: e.key, title: e.title, retry: save.retryUsed };
    $s('end-title').textContent = e.title;
    $s('end-text').textContent = e.text;
    $s('end-money').textContent = won(ending.money);
    $s('end-sat').textContent = `${ending.sat}%`;
    $s('end-retry').classList.toggle('hidden', !ending.retry);
    $s('end-name').value = '';
    $s('end-save').disabled = false;
    clearSave();   // 엔딩을 보면 스토리 저장은 끝난다
    show('ending');
    playBgm('title');
  }
  function readRanks() {
    try { const r = JSON.parse(localStorage.getItem(RANK_KEY) || '[]'); return Array.isArray(r) ? r : []; } catch { return []; }
  }
  function saveRank() {
    if (!ending) return;
    const name = ($s('end-name').value || '').trim().slice(0, 8) || '이름 없음';
    const ranks = readRanks();
    const entry = { name, money: ending.money, sat: ending.sat, ending: ending.title, retry: ending.retry, date: new Date().toISOString().slice(0, 10) };
    ranks.push(entry);
    ranks.sort((a, b) => b.money - a.money || b.sat - a.sat);
    const top = ranks.slice(0, 10);
    try { localStorage.setItem(RANK_KEY, JSON.stringify(top)); } catch { /* 무시 */ }
    ending = null;
    showRanking(top.indexOf(entry));
  }
  function showRanking(highlight = -1) {
    const ranks = readRanks();
    $s('rank-list').innerHTML = ranks.length
      ? ranks.map((r, i) => `<div class="rank-row ${i === highlight ? 'me' : ''}">
          <span class="rank-no">${i + 1}</span>
          <span class="rank-name">${escapeHtml(r.name)}${r.retry ? ' <small>(다시 하기 사용)</small>' : ''}<small>${r.ending} · 만족도 ${r.sat}% · ${r.date}</small></span>
          <b>${won(r.money)}</b>
        </div>`).join('')
      : '<p class="rank-empty">아직 기록이 없어요. 스토리 모드를 끝까지 해 보세요!</p>';
    show('ranking');
  }
  function escapeHtml(t) { return t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function notice(text) { $s('notice-text').textContent = text; $s('story-notice').classList.remove('hidden'); }

  // ── 버튼 연결 ──
  const on = (id, fn) => $s(id).addEventListener('click', fn);
  on('story-btn', openMenu);
  on('story-continue', continueStory);
  on('story-new', newStory);
  on('story-rank', () => showRanking());
  on('story-menu-close', () => showTitle());
  on('confirm-yes', beginNew);
  on('confirm-no', openMenu);
  on('story-intro', beginDay);
  on('sr-next', afterResult);
  on('shop-next', showIntro);
  $s('shop-list').addEventListener('click', (e) => { const b = e.target.closest('.shop-buy'); if (b) buy(b.dataset.id); });
  on('go-retry', retry);
  on('go-new', () => { beginNew(); });
  on('go-home', () => showTitle());
  on('end-save', saveRank);
  on('rank-close', () => showTitle());
  on('notice-close', () => $s('story-notice').classList.add('hidden'));
  // 장사 중에 처음 화면으로 나가면 그날 장사는 저장되지 않는다 (다음에 그날 아침부터)
  on('quit-btn', () => { if (today) { today = null; refreshTitle(); } });

  boot();

  return {
    day: () => (today ? today.day : save ? save.day : 1),
    lockedHint: () => {
      const day = today ? today.day : 1;
      return day < 2 ? 'Day 2에 열리는 틀이에요' : 'Day 5에 열리는 틀이에요';
    },
    onServed, onMissed, onBurnt, renderHud, endDay, refreshTitle,
    // 테스트·밸런스 확인용
    _debug: { DAYS, UPGRADES, get save() { return save; }, set save(v) { save = v; }, get today() { return today; }, persist, buildCfg, beginNew, beginDay, buy, showIntro },
  };
})();
