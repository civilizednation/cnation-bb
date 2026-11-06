'use strict';

// ───────────────────────── 스토리 모드 (1단계) ─────────────────────────
// 겨울 보름(Day 1~15) 동안 손님 만족도를 지키며 돈을 모은다. 기획: docs/story-mode-plan.md
// 1단계 범위: 팥만, 손님은 한 명씩. (줄 서기·슈크림·종류별 봉투는 2단계)
// game.js의 전역(cfg, money, stats, startDay, playBgm, ...)을 함께 쓴다.

const Story = (() => {
  // ── 날짜별 난이도 (기획안 2장, 초기값) ──
  // len: 장사 시간(초, 처음 기획값에서 20% 늘림), arrive: 새 손님이 오는 간격(초), patience: 인내심(초)
  // need: 주문 개수 [최소, 최대], conc: 줄에 함께 설 수 있는 손님 수 (Day 9부터는 화면 밖 "+1" 한 명 더)
  // cream: 한 종류만 시킬 때 슈크림일 확률, mix: 팥·슈크림을 섞어 시킬 확률 (기획안 2장)
  const DAYS = [
    null,
    { len: 54, arrive: [7, 9], patience: 38, need: [1, 2], conc: 1, cream: 0, mix: 0 },
    { len: 60, arrive: [6, 8], patience: 36, need: [1, 2], conc: 1, cream: 0, mix: 0 },
    { len: 66, arrive: [6, 7], patience: 34, need: [1, 3], conc: 1, cream: 0, mix: 0 },
    { len: 66, arrive: [5, 7], patience: 33, need: [1, 3], conc: 2, cream: 0.3, mix: 0 },
    { len: 72, arrive: [5, 6], patience: 32, need: [1, 3], conc: 2, cream: 0.4, mix: 0 },
    { len: 72, arrive: [5, 6], patience: 31, need: [1, 3], conc: 2, cream: 0.4, mix: 0 },
    { len: 78, arrive: [4.5, 5.5], patience: 30, need: [1, 3], conc: 2, cream: 0.5, mix: 0 },
    { len: 78, arrive: [4.5, 5.5], patience: 29, need: [1, 4], conc: 2, cream: 0.4, mix: 0.2 },
    { len: 84, arrive: [4, 5], patience: 28, need: [1, 4], conc: 3, cream: 0.4, mix: 0.25 },
    { len: 84, arrive: [4, 5], patience: 27, need: [2, 4], conc: 3, cream: 0.4, mix: 0.3 },
    { len: 84, arrive: [4, 4.5], patience: 26, need: [2, 4], conc: 3, cream: 0.45, mix: 0.3 },
    { len: 90, arrive: [3.5, 4.5], patience: 25, need: [2, 4], conc: 3, cream: 0.45, mix: 0.35 },
    { len: 90, arrive: [3.5, 4], patience: 24, need: [2, 5], conc: 3, cream: 0.5, mix: 0.35 },
    { len: 90, arrive: [3, 4], patience: 23, need: [2, 5], conc: 3, cream: 0.5, mix: 0.4 },
    { len: 96, arrive: [3, 3.5], patience: 22, need: [2, 5], conc: 3, cream: 0.5, mix: 0.4 },
  ];
  const LAST_DAY = 15;

  // 하루 시작 이야기 (기획안 10장)
  const STORY = [
    null,
    '눈 내리는 골목에 작은 붕어빵 가게를 열었다. 오늘은 첫날, 천천히 해 보자!',
    '어제 왔던 손님이 친구를 데려왔다! 손님이 늘 것 같아 철판을 바꿨다. 이제 틀이 6개다.',
    '동네 아이들이 학교 끝나고 들르기 시작했다.',
    '"슈크림 붕어빵은 없어요?" 손님 말에 슈크림을 준비했다!',
    '동네 철물점 아저씨가 큰 철판을 달아 주셨다. 틀이 9개가 됐다!',
    '옆 골목에서도 우리 가게 이야기를 한다는데…?',
    '주말이다! 아침부터 손님들이 줄을 섰다.',
    '"팥이랑 슈크림 섞어서 주세요!" 주문이 점점 까다로워진다.',
    '단골손님이 생겼다. 이름도 기억해 주신다.',
    '보름의 절반이 지났다. 지금까지 잘해 왔어!',
    '한파 주의보! 몸 녹이러 오는 손님들로 북적인다.',
    '동네 신문에 우리 가게가 실렸다. 오늘은 더 바빠질 것 같다.',
    '손이 빨라졌다. 이제 철판 소리만 들어도 언제 뒤집을지 안다.',
    '마지막 주말. 동네 사람들이 모두 들르는 것 같다.',
    '보름의 마지막 날. 골목에 산타 할아버지가 나타났다는 소문이…! 오늘을 최고의 하루로 만들자!',
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
    { id: 'bag', icon: '🛍️', name: '큰 봉투', prices: [4000, 22000], day: 3 },   // 12개는 비싸게: 초반에 바로 못 사게
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
  // 만족도 규칙(SAT, satAdd, satServeDelta)은 3분 챌린지와 같이 쓰려고 game.js에 있다

  // ── 저장 (기획안 9장: 보내 주신 저장 코드를 이 게임에 맞게 고친 것) ──
  const SAVE_KEY = 'cnation-bb-story-v1', DB = 'cnation-bb-saves', STORE = 'slots', SAVE_VERSION = 1;
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
      gap: () => rand(d.arrive[0], d.arrive[1]) * fx.gap(u),
      firstGap: 1.5,
      queue: true,                       // 손님이 줄을 선다 (손님 처리는 아래 줄 서기 코드)
      cream: day >= 4,                   // 슈크림 메뉴
      capacity: d.conc + (day >= 9 ? 1 : 0),
      creamRatio: d.cream, mixRatio: d.mix,
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
    hudMode = 'story'; lastSatDrawn = null;   // 이야기 화면 뒤 만족도 칸도 스토리 값으로
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
    if (typeof clearQueue === 'function') clearQueue();
    molds.forEach((m, i) => { setMold(m, 'empty'); m.flipAt = -1; m.locked = !before.includes(i); });
  }
  function showIntro() {
    const day = save.day;
    prepareScene(day);
    $s('intro-day').textContent = `Day ${day}`;
    $s('intro-text').textContent = STORY[day];
    const extra = [];
    if (day === 2 || day === 5) extra.push(`🔓 틀이 ${moldCount(day)}개로 늘었어요!`);
    if (day === 4) extra.push('🍮 슈크림 메뉴 추가! 반죽 위에 슈크림을 올려 구워요. 슈크림 붕어빵은 200원 더 받아요.');
    if (day === 8) extra.push('📝 이제 팥과 슈크림을 섞어 시키는 손님도 와요.');
    if (DAYS[day].conc > (DAYS[day - 1]?.conc || 1)) extra.push(`👥 손님이 ${DAYS[day].conc}명까지 줄을 서요.`);
    $s('intro-extra').textContent = extra.join('\n');
    show('story-intro');
    playBgm('title');
  }
  function beginDay() {
    const day = save.day;
    mode = 'story';
    cfg = buildCfg(day, save.upgrades);
    today = { day, startMoney: save.money, satStart: save.satisfaction, sat: save.satisfaction,
      combo: 0, fast: 0, served: 0, left: 0, burnt: 0, perfect: 0, dum: 0, wrong: 0, specials: [], arrivals: 0, auntieHappy: false };
    buzzUntil = 0;
    const before = day > 1 ? moldsFor(day - 1) : [];
    startDay(save.money);
    clearQueue();
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
    if (cfg.challenge) return chChange(delta);   // 3분 챌린지 만족도는 game.js의 chSat
    if (!today) return;
    today.sat = satAdd(today.sat, delta);
    if (today.sat <= 0 && running) gameOver();
  }
  function onServed(ratio, allPerfect) {
    today.served++;
    today.combo++;
    if (ratio > 0.7) today.fast++;
    if (today.combo % SAT.comboEvery === 0) setTimeout(() => toast(`🔥 ${today.combo}콤보! 만족도 보너스`), 650);
    if (allPerfect) today.perfect++;
    changeSat(satServeDelta(ratio, today.combo, allPerfect));
  }
  function onMissed(penalty, special) { today.left++; today.combo = 0; changeSat(penalty || (special ? SAT.leaveSpecial : SAT.leave)); }
  function onBurnt() { today.burnt++; today.combo = 0; changeSat(SAT.burn); }

  function renderHud() {
    if (!today && !save) return;   // 엔딩 뒤 등: 마지막으로 그린 값을 그대로 둔다
    const v = today ? today.sat : save.satisfaction;
    drawSat(v);
  }

  // ── 하루 끝: 정산 → 상점 ──
  function endDay() {
    clearQueue();
    const day = today.day;
    const net = money - today.startMoney;
    const row = (label, value, cls = '') => `<div class="row ${cls}"><span>${label}</span><b>${value}</b></div>`;
    const satDiff = Math.round(today.sat) - Math.round(today.satStart);
    $s('sr-title').textContent = `Day ${day} 장사 정산`;
    $s('sr-rows').innerHTML = [
      row('판매한 붕어빵', `${stats.sold}개`),
      row('판매 매출', `+${won(stats.sales)}`, 'plus'),
      row('손님 팁', `+${won(stats.tips)}`, 'plus'),
      row(`재료비 (반죽 1회 ${won(BATTER_COST)})`, `-${won(stats.cost)}`, 'minus'),
      '<hr>',
      row('오늘 순이익', won(net), 'total'),
      row('가진 돈', won(money)),
      row('손님 만족도', `${Math.round(today.satStart)}% → ${Math.round(today.sat)}% (${satDiff >= 0 ? '+' : ''}${satDiff})`),
      row('빠른 제공 · 떠난 손님 · 탄 붕어빵', `${today.fast}번 · ${today.left}명 · ${today.burnt}개`),
      today.dum || today.wrong ? row('덤으로 준 붕어빵 · 잘못 건넨 횟수', `${today.dum}개 · ${today.wrong}번`) : '',
      today.specials.length ? row('오늘의 특별 손님', today.specials.map((x) => `${x.name} ${x.ok ? '😊' : x.ok === false ? '😢' : '-'}`).join(' · ')) : '',
      `<p class="leftover">${leftoverText()}</p>`,
    ].join('');
    // 아침 상태를 다음 날 것으로 바꿔서 저장한다 (정산을 끝낸 뒤에 앱을 꺼도 그날 결과가 남게)
    save.money = money;
    save.satisfaction = today.sat;
    save.stats.sold += stats.sold; save.stats.missed += stats.missed; save.stats.burnt += stats.burnt;
    // 엔딩에서 보여 줄 날마다의 기록
    (save.history ||= []).push({ day, net, sat: Math.round(today.sat), sold: stats.sold, left: today.left, burnt: today.burnt,
      met: today.specials.filter((x) => x.ok).map((x) => x.id) });
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

  let ending = null;          // 랭킹에 올릴 스토리 결과 (엔딩 또는 게임 오버)
  // ── 3분 챌린지 줄 서기 (v1.5.9) ──
  // 줄·봉투·덤·잘못 건넴 규칙은 스토리와 같은 코드를 쓴다. today는 그날 기록용 가벼운 객체
  function beginChallenge() {
    today = { challenge: true, day: 0, startMoney: 0, satStart: SAT.start, sat: SAT.start,
      combo: 0, fast: 0, served: 0, left: 0, burnt: 0, perfect: 0, dum: 0, wrong: 0, specials: [], arrivals: 0, auntieHappy: false };
    buzzUntil = 0;
    clearQueue();
  }
  function endChallenge() { clearQueue(); today = null; }

  // ── 게임 오버 ──
  // 그날 다시 하기는 없다(v1.5.4): 게임 오버가 되면 스토리가 끝나고, 그때까지 모은 돈으로 랭킹에 올릴 수 있다
  function gameOver() {
    running = false;
    clearQueue();
    playBgm(null);
    play('sad');
    save.money = money;          // 그날 번 돈까지 모은 돈으로 친다
    save.satisfaction = 0;
    today = null;
    mode = 'challenge'; cfg = CHALLENGE;
    save.gameOver = true;        // 이름을 남기기 전에 나갔다 와도 게임 오버 화면부터 다시 보이게
    persist();
    showGameOver();
  }
  function showGameOver() {
    $s('go-text').textContent = `손님들이 발길을 끊었어요… Day ${save.day}에 가게 문을 닫았습니다.`;
    $s('go-money').textContent = won(save.money);
    $s('go-day').textContent = `Day ${save.day}`;
    ending = { money: save.money, sat: 0, key: 'gameover', title: `게임 오버 (Day ${save.day})`, retry: false };
    $s('go-name').value = Ranks.lastName();
    $s('go-save').disabled = false;
    show('gameover');
  }

  // ── 엔딩 · 랭킹 (기획안 8장) ──
  const ENDINGS = [
    { min: 90, key: 'star', title: '⭐ 동네 명물 엔딩', text: '줄 서서 먹는 집이 되었어요! 동네 사람 모두가 우리 붕어빵을 기억해요.' },
    { min: 60, key: 'regular', title: '단골 가게 엔딩', text: '손님들이 내년 겨울에도 꼭 와 달래요.' },
    { min: 0, key: 'survive', title: '무사 완주 엔딩', text: '힘들었지만 보름을 끝까지 버텼어요.' },
  ];
  function showEnding() {
    const sat = save.satisfaction;
    const e = ENDINGS.find((x) => sat >= x.min);
    ending = { money: save.money, sat: Math.round(sat), key: e.key, title: e.title, retry: false };
    $s('end-title').textContent = e.title;
    $s('end-text').textContent = e.text;
    $s('end-money').textContent = won(ending.money);
    $s('end-sat').textContent = `${ending.sat}%`;
    $s('end-name').value = Ranks.lastName();
    $s('end-save').disabled = false;
    $s('end-story').innerHTML = endingRecords(save);
    clearSave();   // 엔딩을 보면 스토리 저장은 끝난다
    show('ending');
    playBgm('title');
    autoScrollEnding();
  }
  // 엔딩 창이 화면보다 길면, 기록이 나타나는 속도에 맞춰 천천히 아래로 내려간다 (손으로 만지면 멈춤)
  let endScrollRaf = 0;
  function autoScrollEnding() {
    const panel = document.querySelector('#ending .panel');
    cancelAnimationFrame(endScrollRaf);
    panel.scrollTop = 0;
    const DELAY = 1200, SPEED = 28;   // 1.2초 뒤부터 초당 28px
    let start = 0, stopped = false;
    const stop = () => { stopped = true; cancelAnimationFrame(endScrollRaf); };
    ['pointerdown', 'wheel', 'touchstart'].forEach((ev) => panel.addEventListener(ev, stop, { once: true, passive: true }));
    const step = (t) => {
      if (stopped || $s('ending').classList.contains('hidden')) return;
      if (!start) start = t;
      const max = panel.scrollHeight - panel.clientHeight;
      const target = Math.min(max, Math.max(0, (t - start - DELAY) / 1000 * SPEED));
      panel.scrollTop = target;
      if (target < max || t - start < DELAY + 6000) endScrollRaf = requestAnimationFrame(step);   // 기록이 다 나올 때까지는 계속 확인
    };
    endScrollRaf = requestAnimationFrame(step);
  }
  // 보름 장사 기록: 한 줄씩 차례로 나타난다 (CSS .end-rec 애니메이션)
  function endingRecords(s) {
    const h = s.history || [];
    const items = [];
    const add = (icon, label, value) => items.push(`<div class="end-rec" style="animation-delay:${0.35 + items.length * 0.45}s"><span>${icon} ${label}</span><b>${value}</b></div>`);
    add('🗓️', '장사한 날', `${h.length || LAST_DAY}일`);
    add('🐟', '판 붕어빵', `${s.stats.sold.toLocaleString()}개`);
    if (h.length) {
      const best = h.reduce((a, b) => (b.net > a.net ? b : a));
      add('💰', '가장 많이 번 날', `Day ${best.day} · ${won(best.net)}`);
      const perfect = h.filter((d) => !d.left && !d.burnt).length;
      add('✨', '실수 없는 날', `${perfect}일`);
    }
    add('😢', '떠난 손님 · 탄 붕어빵', `${s.stats.missed}명 · ${s.stats.burnt}개`);
    const met = new Set(h.flatMap((d) => d.met || []));
    if (met.size) add('🏠', '만난 동네 사람', `${met.size}명`);
    // 날마다 번 돈 막대
    let chart = '';
    if (h.length) {
      const max = Math.max(1, ...h.map((d) => d.net));
      chart = `<div class="end-chart" style="animation-delay:${0.35 + items.length * 0.45}s">${h.map((d) =>
        `<i title="Day ${d.day}" style="height:${Math.max(4, Math.round(Math.max(0, d.net) / max * 100))}%;background:${d.sat >= 70 ? '#5dbb63' : d.sat >= 40 ? '#f5a623' : '#e74c3c'}"></i>`).join('')}</div>
        <p class="end-chart-cap" style="animation-delay:${0.35 + items.length * 0.45}s">날마다 번 돈 (색: 그날 만족도)</p>`;
    }
    return items.join('') + chart;
  }
  function saveRank(inputId = 'end-name') {
    if (!ending) return;
    const name = ($s(inputId).value || '').trim().slice(0, 8) || '이름 없음';
    Ranks.rememberName(name);
    const entry = { name, money: ending.money, sat: ending.sat, ending: ending.title, retry: ending.retry, date: new Date().toISOString().slice(0, 10) };
    const at = Ranks.add('story', entry);
    ending = null;
    clearSave();   // 랭킹에 올렸으면 이번 스토리는 끝
    submitRank('story', entry, at);
  }
  // 랭킹 3종: 스토리 모드 · 3분 챌린지 팥 · 3분 챌린지 팥 & 슈크림
  // 판마다 🌏 전체(온라인, online.js)와 📱 내 기기(이 기기 기록)를 볼 수 있다
  let rankBoard = 'story';
  let rankScope = 'online';
  let rankToken = 0;
  // hl: { local: 내 기기 목록에서 내 기록 순번, id: 온라인 기록 id }, note: 위에 띄울 안내
  function showRanking(board = rankBoard, hl = {}, note = '') {
    rankBoard = board;
    if (typeof hl === 'number') hl = { local: hl };
    document.querySelectorAll('#rank-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.board === board));
    document.querySelectorAll('#rank-scope button').forEach((b) => b.classList.toggle('on', b.dataset.scope === rankScope));
    $s('rank-note').textContent = note;
    $s('rank-note').classList.toggle('hidden', !note);
    show('ranking');
    const token = ++rankToken;
    if (rankScope === 'local') return renderRanks(board, Ranks.read(board), (r, i) => i === hl.local);
    const cached = Online.cached(board);
    if (cached) renderRanks(board, cached, (r) => r.id === hl.id);
    else $s('rank-list').innerHTML = '<p class="rank-empty">전체 랭킹을 불러오는 중…</p>';
    Online.top(board).then((list) => {
      if (token === rankToken) renderRanks(board, list, (r) => r.id === hl.id);
    }).catch(() => {
      if (token !== rankToken) return;
      if (cached) {
        // 인터넷이 안 될 때: 마지막으로 받아 둔 목록을 그대로 두고, 언제 것인지 알려 준다
        const t = new Date(Online.savedAt(board));
        const when = `${t.getMonth() + 1}/${t.getDate()} ${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`;
        if (!note) {
          $s('rank-note').textContent = `인터넷 연결이 안 돼서 마지막으로 받은 목록이에요 (${when})`;
          $s('rank-note').classList.remove('hidden');
        }
        return;
      }
      $s('rank-list').innerHTML = '<p class="rank-empty">전체 랭킹을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.<br>📱 내 기기 기록은 볼 수 있어요.</p>';
    });
  }
  function renderRanks(board, ranks, isMe) {
    const sub = (r) => board === 'story'
      ? `${escapeHtml(r.ending || '')} · 만족도 ${r.sat}% · ${r.date}`
      : [Number.isFinite(r.net) ? `순이익 ${won(r.net)}` : '', Number.isFinite(r.sat) ? `만족도 ${r.sat}%` : '', r.date || ''].filter(Boolean).join(' · ');
    const empty = rankScope === 'online' ? '아직 전체 기록이 없어요. 첫 기록의 주인공이 되어 보세요!'
      : `아직 기록이 없어요. ${board === 'story' ? '스토리 모드를 끝까지 해 보세요!' : '3분 챌린지에 도전해 보세요!'}`;
    $s('rank-list').innerHTML = ranks.length
      ? ranks.map((r, i) => `<div class="rank-row ${isMe(r, i) ? 'me' : ''}">
          <span class="rank-no">${i + 1}</span>
          <span class="rank-name">${escapeHtml(r.name)}${r.retry ? ' <small>(다시 하기 사용)</small>' : ''}<small>${sub(r)}</small></span>
          <b>${board === 'story' ? won(r.money) : `${r.money.toLocaleString()}점`}</b>
        </div>`).join('')
      : `<p class="rank-empty">${empty}</p>`;
  }
  // 내 기기에 저장한 기록을 전체 랭킹에도 올린다. 실패하면 내 기기 기록을 보여 준다
  function submitRank(board, entry, localAt) {
    rankScope = 'online';
    rankBoard = board;
    showRanking(board, {}, '전체 랭킹에 올리는 중…');
    Online.add(board, entry)
      .then((id) => { if (rankBoard === board) showRanking(board, { id }); })
      .catch(() => {
        if (rankBoard !== board) return;
        rankScope = 'local';
        showRanking(board, { local: localAt }, '전체 랭킹에 올리지 못했어요. 이 기기에는 저장했어요.');
      });
  }
  function escapeHtml(t) { return t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function notice(text) { $s('notice-text').textContent = text; $s('story-notice').classList.remove('hidden'); }

  // ───────────────────────── 손님 줄 서기 (기획안 5·6장, 2단계) ─────────────────────────
  // 손님은 한 줄로 서고 항상 맨 앞 손님에게 건넨다. 봉투를 한 번 누를 때마다 한 개씩.
  // 화면 배치는 시안 C2 (docs/mockups/queue-final.webp): 뒤로 갈수록 작고 어둡고 조금 위(계단식).
  const SLOTS = [
    { x: 72, up: 0, s: 1, dim: 1 },          // 맨 앞
    // 손님 그림은 허리 아래가 잘린 반신이라, 밑단을 모두 계산대(z-index 더 위)에 붙여서 잘린 부분을 가린다 (v1.5.9)
    { x: 20, up: 0, s: 0.84, dim: 0.8 },     // 2번째
    { x: -26, up: 0, s: 0.70, dim: 0.66 },   // 3번째 (4번째부터는 그리지 않고 "+N")
  ];
  const BOX = 145, COUNTER = 262, TAG_TOP = 70;
  const THANKS_WAIT = 0.6;      // 다 받은 손님이 "고마워요!" 하고 떠나기까지 (이 사이에 더 주면 덤)
  const CREAM_BONUS = 200;      // 슈크림 붕어빵은 200원 더 받는다
  const FRONT_DELAY = 0.6;      // 맨 앞 손님이 떠난 뒤 다음 손님 말풍선이 뜨기까지

  const queueEl = document.createElement('div');
  queueEl.id = 'queue';
  stage.insertBefore(queueEl, document.getElementById('bubble'));
  const moreEl = document.createElement('div');
  moreEl.className = 'qmore';
  queueEl.appendChild(moreEl);

  let Q = [];               // 줄 선 손님 (0번이 맨 앞)
  let leaving = [];         // 떠나는 중인 손님 (그림만 남아 있음)
  let arriveIn = 0;
  let frontReadyAt = 0;     // 이 시각이 지나야 맨 앞 손님이 주문을 받는다 (앞 손님이 떠나는 동안)
  let bubbleOwner = null;   // 지금 말풍선이 누구 것인지
  let bubblePopAt = -1;
  let lastRender = 0;

  // 줄 길이: 스토리는 날마다 정해진 숫자, 3분 챌린지는 시간에 따라 바뀐다 (cfg.capacity가 함수)
  const cap = () => (typeof cfg.capacity === 'function' ? cfg.capacity(elapsed) : cfg.capacity);
  function clearQueue() {
    Q.concat(leaving).forEach((e) => { e.el.remove(); e.tag.remove(); });
    Q = []; leaving = [];
    arriveIn = cfg.firstGap || 1.5;
    frontReadyAt = 0; bubbleOwner = null; bubblePopAt = -1;
    moreEl.textContent = '';
  }

  // 최근 손님과 지금 줄에 선 손님은 다시 뽑지 않는다
  const recentQ = [];
  function pickQueued() {
    const busy = new Set(Q.map((e) => e.def.id).concat(recentQ));
    let pool = CUSTOMERS.filter((c) => !busy.has(c.id));
    if (!pool.length) pool = CUSTOMERS.filter((c) => !Q.some((e) => e.def.id === c.id));
    if (!pool.length) pool = CUSTOMERS;
    const def = pool[Math.floor(Math.random() * pool.length)];
    recentQ.push(def.id); if (recentQ.length > 2) recentQ.shift();
    return def;
  }
  function makeOrder() {
    const n = cfg.need(progress());
    if (!cfg.cream) return { bean: n, cream: 0 };
    if (n >= 2 && Math.random() < cfg.mixRatio) {
      const c = 1 + Math.floor(Math.random() * (n - 1));
      return { bean: n - c, cream: c };
    }
    return Math.random() < cfg.creamRatio ? { bean: 0, cream: n } : { bean: n, cream: 0 };
  }
  function orderPhrase(o) {
    if (o.bean && o.cream) return `팥 ${o.bean}개랑 슈크림 ${o.cream}개`;
    if (o.cream) return `슈크림 ${o.cream}개`;
    return cfg.cream ? `팥 ${o.bean}개` : `${o.bean}개`;
  }
  // 주문표: 뒤 손님은 주문 전체, 맨 앞 손님은 남은 개수 (다 받은 종류는 ✓)
  function countText(o, left) {
    const parts = [];
    if (o.bean) parts.push(`팥${left ? (left.bean || '✓') : o.bean}`);
    if (o.cream) parts.push(`슈${left ? (left.cream || '✓') : o.cream}`);
    return parts.join(' · ');
  }

  // ───────────────────────── 특별 손님 (3단계: 사람 손님 7명) ─────────────────────────
  // 사람 손님은 저마다 규칙이 있다. 동네 사람이라 Day 1부터 모두 온다(매일 첫 두 손님은 동물).
  // 하루에 한 명(Day 9부터 두 명)까지, 같은 손님은 하루 한 번.
  // 게임 속도를 위해 선택 버튼은 없다: "싸게 달라는" 손님(꼬마·윤이 엄마)은 그냥 싸게 판다.
  const SPECIALS = {
    courier: { name: '택배기사', from: 1, need: [1, 2], patience: 0.4, tipEach: 600,
      lines: ['배송 세 건 남았어요! {n} 빨리요!', '{n} 주세요! 트럭 세워 두고 왔어요!', '엘리베이터 고장이라 계단 탔어요… {n}요, 빨리!', '오늘만 택배가 백 개예요! {n} 부탁해요!', '{n}요! 빨리 주시면 팁 드릴게요!'],
      thanks: '덕분에 배송 늦지 않겠어요! 감사합니다!' },
    principal: { name: '유치원 원장님', from: 1, need: [6, 9], patience: 2.5, bonus: 3000, satBonus: 3,
      lines: ['아이들 간식으로 {n} 부탁드려요~', '오늘은 우리 반 아이들 모두 먹을 {n}요~', '선생님들 몫까지 {n} 넉넉히요~', '{n} 주세요~ 아이들이 손꼽아 기다려요!', '천천히 하셔도 돼요. {n} 부탁해요~'],
      thanks: '아이들이 정말 좋아하겠어요! 단체 주문 감사 인사예요~' },
    grandpa: { name: '동네 할아버지', from: 1, need: [2, 3], patience: 1.2,
      lines: ['{n} 주게. 내일부터 자주 올게.'],
      usual: ['늘 먹던 걸로 주게.', '허허, 늘 먹던 걸로.', '자네, 내가 늘 먹던 거 알지?'],
      thanks: '허허, 역시 기억하는구먼!' },
    girl: { name: '초등학생', from: 1, need: [1, 1], fixedPrice: 500, satBonus: 2,
      lines: ['500원밖에 없는데… {n}만 주세요…', '용돈이 모자라요… {n}만 500원에 안 될까요?', '엄마 몰래 왔어요. 500원으로 {n}요!'],
      thanks: '고맙습니다! 착한 가게라고 소문낼게요!' },
    boy: { name: '초등학생', from: 1, need: [1, 3], change: true,
      lines: ['{n} 주세요! 학원 가야 돼요!', '{n}요! 친구랑 나눠 먹을 거예요!', '축구하다 왔어요. {n} 주세요!'] },
    auntie: { name: '윤이 엄마', from: 1, need: [3, 5], discount: 0.3,
      lines: ['단골인데 {n} 좀 깎아 줘요~ 윤이가 엄청 좋아해요~', '사장님, {n} 싸게 줘요~ 윤이 간식이에요!', '윤이 학원 끝나고 먹을 거예요. {n} 좀 깎아 줘요~', '오늘은 윤이 친구들 것까지 {n}요~ 싸게요!', '윤이가 여기가 제일 맛있대요. {n} 깎아 줘요~'],
      thanks: '역시 단골 대접! 동네에 소문낼게요~' },
    yuni: { name: '윤이', from: 1, need: [4, 6], 
      lines: ['배고파요… 급식 먹었는데 또 배고파요. {n}요.', '엄마가 여기 제일 맛있대요. {n} 주세요.', '학원 가기 전에 {n} 먹을게요.', '친구들 것까지 {n}요. 감사합니다!', '{n} 주세요. 엄마한테 자랑할 거예요.'],
      thanks: '엄마가 사장님 칭찬 엄청 했어요!' },
    // 현이: 윤이 형, 윤이 엄마의 첫째 아들. 서울 수방사에서 근무해서 휴가를 자주 나온다 (다른 동네 사람과 같은 규칙)
    hyun: { name: '휴가 나온 현이', from: 1, need: [5, 8], patience: 0.8, tipEach: 400, satBonus: 3,
      lines: ['휴가 나왔습니다! {n} 부탁드립니다!', '부대에서 제일 생각났던 게 이거예요. {n}요!', '윤이 형입니다. 엄마가 꼭 들르래요. {n}요!', '복귀 전에 동기들 줄 {n} 포장이요!', '휴가가 짧아서요… {n} 빨리 부탁드립니다!'],
      thanks: '충성! 복귀해서도 이 맛 생각날 거예요!' },
    // ── v1.5.0 새 특별 손님 ──
    // 배고픈 나그네: 돈을 내지 않는다. 주면 만족도 +3, 못 주고 떠나면 동네 소문이 나빠져 -20
    beggar: { name: '배고픈 나그네', from: 1, need: [1, 2], free: true, satBonus: 3, leavePenalty: -20, happyImg: true,
      lines: ['며칠째 굶었어요… {n}만 주실 수 있나요?', '돈은 없지만… {n}만 나눠 주세요.', '꼭 갚을게요… {n}만 부탁해요.', '냄새만 맡아도 행복하네요… {n}만요.', '날이 너무 추워요… {n}만 주시면 안 될까요?'],
      leaveLine: '…배가 너무 고프네요. 그냥 갈게요.',
      thanks: '고맙습니다… 복 받으실 거예요.' },
    // 건물주 아저씨: 주문하지 않는다. 자랑을 실컷 하고 용돈만 주고 간다 (드물게 온다)
    landlord: { name: '건물주 아저씨', from: 1, noOrder: true, weight: 1 / 3, patience: 99, gift: [5000, 20000], happyImg: true,
      lines: ['저기 저 건물 보이지? 내 거야. 그 옆 건물도 내 거고~', '이 골목 반이 내 땅이야. 허허, 장사는 잘 되나?', '어제 건물을 하나 더 샀어. 요즘 심심해서 말이야~', '붕어빵? 난 안 먹어. 근데 열심히 하는 게 보기 좋아서~', '저기 빨간 차 내 거야. 세 대 중에 제일 싼 거~'],
      thanks: '자, 용돈이야! 장사 잘하라고~ 허허허!' },
    // 외국인 관광객: 빨리 주면 한 개에 500원씩 팁
    tourist: { name: '외국인 관광객', from: 1, need: [2, 4], tipEach: 500,
      lines: ['Hello! {n}, please! 한국 최고!', 'Wow, fish bread! {n} please~', 'I saw it on YouTube! {n} 주세요!', '{n}, please! 사진 찍어도 돼요?', 'Excuse me~ {n}! So cute!'],
      thanks: 'Delicious! 정말 맛있어요! 👍' },
    // 닭살 커플: 팥·슈크림을 하나씩 나눠 먹는 세트 주문. 한 번에 맞게 주면 +4, 한 번이라도 잘못 주면 -6
    couple: { name: '닭살 커플', from: 1, need: [2, 4], couple: true, satBonus: 4, wrongPenalty: -6,
      lines: ['자기야 뭐 먹을래? 우리 {n}요~', '오늘 100일이에요! {n} 주세요~', '우리 자기가 붕어빵 좋아해서요. {n}요!', '하나씩 나눠 먹을 거예요~ {n}요!', '자기 손 시리지? 얼른 {n} 주세요~'],
      wrongLine: '헐… 우리 그거 안 시켰는데요?',
      thanks: '역시 여기가 우리 데이트 코스예요!' },
    // 산타 할아버지: 마지막 날(Day 15)에만, 장사 중간쯤 딱 한 번 오는 보스. 큰 주문, 다 주면 10만 원 선물
    santa: { name: '산타 할아버지', from: 99, boss: true, need: [16, 20], patience: 3, bonus: 100000, satBonus: 5, leavePenalty: -15, happyImg: true, noSad: true,
      lines: ['호호호! 착한 아이들 선물로 {n} 부탁하네!', '썰매에 실을 붕어빵, {n} 준비해 주게!', '루돌프도 기다린다네. {n} 부탁하네!', '올해 마지막 선물은 붕어빵이야! {n}일세!', '전 세계 아이들이 기다린다네! {n} 부탁하네!'],
      leaveLine: '허허… 올해는 선물을 못 주겠구나…',
      thanks: '호호호! 올해 최고의 선물이구나! 자, 내 선물도 받게!' },
  };
  let buzzUntil = 0;   // 윤이 엄마가 소문을 내면 잠깐 손님이 더 자주 온다
  let forceSpecial = null;   // 시험용 (_debug.forceSpecial)
  function specialFor(day) {
    if (!today || cfg.challenge) return null;   // 3분 챌린지는 동물 손님만
    if (forceSpecial) { const f = forceSpecial; forceSpecial = null; return f; }
    // 매일 첫 번째·두 번째 손님은 동물 손님: 붕어빵을 미리 굽기 전에 급한 특별 손님이 오지 않게
    if (today.arrivals < 2) return null;
    // 산타: 마지막 날 장사가 35% 지나면 딱 한 번 (하루 인원 제한과 상관없이)
    if (day === LAST_DAY && !today.santa && elapsed >= cfg.dayLength * 0.35) { today.santa = true; return 'santa'; }
    const max = day >= 9 ? 2 : 1;
    if (today.specials.length >= max) return null;
    const seen = new Set(today.specials.map((x) => x.id).concat(Q.map((e) => e.sp).filter(Boolean)));
    const ok = Object.keys(SPECIALS).filter((id) => {
      const sp = SPECIALS[id];
      if (seen.has(id) || day < sp.from || sp.boss) return false;
      return true;
    });
    if (!ok.length || Math.random() > 1 / 6) return null;
    // 손님마다 뽑힐 가중치 (기본 1, 건물주는 1/3)
    const total = ok.reduce((a, id) => a + (SPECIALS[id].weight || 1), 0);
    let r = Math.random() * total;
    for (const id of ok) { r -= SPECIALS[id].weight || 1; if (r < 0) return id; }
    return ok[ok.length - 1];
  }
  // 주문 n개를 종류로 나눈다 (슈크림 날만)
  function splitOrder(n) {
    if (!cfg.cream) return { bean: n, cream: 0 };
    if (n >= 2 && Math.random() < Math.max(cfg.mixRatio, 0.3)) { const c = 1 + Math.floor(Math.random() * (n - 1)); return { bean: n - c, cream: c }; }
    return Math.random() < cfg.creamRatio ? { bean: 0, cream: n } : { bean: n, cream: 0 };
  }

  function spawnQueued() {
    const spId = specialFor(today ? today.day : 1);
    const sp = spId ? SPECIALS[spId] : null;
    if (today) today.arrivals++;
    const def = sp ? { id: spId, lines: sp.lines } : pickQueued();
    let order;
    if (spId === 'grandpa' && save.grandpaOrder) order = { ...save.grandpaOrder };
    else if (sp && sp.noOrder) order = { bean: 0, cream: 0 };
    else if (sp) {
      // 동네 사람은 처음부터 모두 온다. 틀이 적은 초반(Day 1~2)에는 단체 주문을 조금 줄인다
      const n = sp.need[0] + Math.floor(Math.random() * (sp.need[1] - sp.need[0] + 1));
      const scale = Math.min(1, 0.55 + 0.15 * (today ? today.day : 3));
      order = splitOrder(Math.max(1, Math.round(n * scale)));
    }
    else order = makeOrder();
    if (spId === 'girl') order = cfg.cream && Math.random() < 0.4 ? { bean: 0, cream: 1 } : { bean: 1, cream: 0 };
    // 산타: 큰 주문은 팥·슈크림 반반
    if (spId === 'santa' && cfg.cream) { const n = order.bean + order.cream; order = { bean: Math.ceil(n / 2), cream: Math.floor(n / 2) }; }
    // 커플: 둘이 나눠 먹는 세트 (슈크림이 있으면 팥·슈크림 반반, 없으면 팥 2개)
    if (sp && sp.couple) { const k = Math.random() < 0.5 ? 1 : 2; order = cfg.cream ? { bean: k, cream: k } : { bean: 2, cream: 0 }; }
    const el = document.createElement('div');
    el.className = 'qc';
    const img = document.createElement('img');
    img.alt = '';
    img.src = (customerImgCache[def.id] || {}).src || SPRITE + def.id + '.webp';
    el.appendChild(img);
    const tag = document.createElement('div');
    tag.className = 'qtag';
    tag.innerHTML = '<span></span><i><b></b></i>';
    queueEl.appendChild(el);
    queueEl.appendChild(tag);
    const max = cfg.patience(progress()) * (sp && sp.patience ? sp.patience : 1);
    const i = Q.length, slot = SLOTS[Math.min(i, 2)];
    let line = pickLine(def);
    // 할아버지: 단골 주문이 있으면 "늘 먹던 걸로" (개수는 숨긴다: 기억해야 한다)
    const usual = spId === 'grandpa' && !!save.grandpaOrder;
    if (usual) line = sp.usual[Math.floor(Math.random() * sp.usual.length)];
    const e = { def, sp: spId, order, line, left: { ...order }, wait: max, max, state: 'in', t: 0, el, img, tag,
      x: -170, up: slot.up, s: slot.s, dim: slot.dim, perfect: true, dum: { bean: 0, cream: 0 }, restoreAt: 0,
      hide: usual, wrongOnce: false };
    if (spId === 'grandpa' && !save.grandpaOrder) save.grandpaOrder = { ...order };
    if (sp) { e.el.classList.add('special'); today.specials.push({ id: spId, name: sp.name, ok: null }); }
    Q.push(e);
    play('bell', 0.5);
    if (sp) setTimeout(() => play('bell', 0.5), 160);   // 특별 손님은 종이 두 번 울린다
  }

  function lineHtml(e) {
    return e.line.replace('{n}', `<span class="n">${orderPhrase(e.order)}</span>`);
  }
  function showFrontBubble(e) {
    bubbleOwner = e;
    const nm = $s('bubble-name');
    nm.textContent = e.sp ? SPECIALS[e.sp].name : '';
    setBubble(lineHtml(e));
    bubblePopAt = performance.now();
  }

  function takeBread(kind) {
    if (kind === 'cream') return creamPerfect.shift();
    bagCount--;
    return bagPerfect.shift();
  }
  function dumText(d) {
    const parts = [];
    if (d.bean) parts.push(`팥 ${d.bean}개`);
    if (d.cream) parts.push(`슈크림 ${d.cream}개`);
    return parts.join('랑 ');
  }

  // 봉투를 한 번 누르면 맨 앞 손님에게 한 개
  function serve(kind) {
    play('bag');
    const e = Q[0];
    const bag = kind === 'cream' ? creamPerfect : bagPerfect;
    if (!e || e.state === 'in' || elapsed < frontReadyAt) return hint('손님이 아직 없어요');
    if (!bag.length) return hint(`${kind === 'cream' ? '슈크림' : '팥'} 봉투가 비었어요`);
    if (e.state === 'thanks') {
      // 다 받은 뒤 떠나기 전에 더 준 것은 덤: 붕어빵만 나가고 돈은 받지 않는다
      takeBread(kind);
      e.dum[kind]++;
      today.dum++;
      setBubble(`<b>${dumText(e.dum)} 덤으로 주셨네요! 고마워요!</b>`);
      return;
    }
    if (e.state !== 'wait') return;
    if (e.sp && SPECIALS[e.sp].noOrder) return hint('붕어빵은 안 드신대요');
    if (e.left[kind] > 0) {
      if (!takeBread(kind)) e.perfect = false;
      e.left[kind]--;
      play('collect', 0.5);
      if (e.sp === 'boy' && !e.changed && (e.left.bean || e.left.cream)) changeOrder(e);
      else if (e.sp === 'boy' && !e.changed && !e.left.bean && !e.left.cream) { changeOrder(e, true); return; }
      if (!e.left.bean && !e.left.cream) complete(e);
    } else if (e.order[kind] > 0) {
      // 시킨 종류인데 이미 다 받았다: 벌은 없고 안내만 (3분 챌린지와 같게)
      hint('그건 이미 다 드렸어요');
    } else {
      // 안 시킨 종류: 돌려주고 만족도 감소
      today.wrong++;
      const wsp = e.sp ? SPECIALS[e.sp] : null;
      changeSat(wsp && wsp.wrongPenalty ? wsp.wrongPenalty : SAT.wrong);
      play('sad', 0.6);
      e.wrongOnce = true;
      if (e.sp === 'grandpa') {
        // 틀리면 단골 주문을 알려 준다
        e.hide = false;
        setBubble(`<span style="color:#c0392b">허허, 그게 아니지. <span class="n">${orderPhrase(e.order)}</span>일세.</span>`);
        e.line = `늘 먹던 걸로… <span class="n">${orderPhrase(e.order)}</span>일세.`;
        e.restoreAt = elapsed + 1.6;
      } else {
        if (wsp && wsp.couple) e.img.src = (customerImgCache[e.def.id + '-sad'] || e.img).src;   // 커플은 바로 화난다
        setBubble(`<span style="color:#c0392b">${wsp && wsp.wrongLine ? wsp.wrongLine : '그건 안 시켰어요!'}</span>`);
        e.restoreAt = elapsed + 1.1;
      }
    }
  }

  // 남자 꼬마: 한 번 주문을 바꾼다 (하나 더 / 남은 것의 종류 바꾸기)
  function changeOrder(e, addOnly) {
    e.changed = true;
    const left = e.left.bean ? 'bean' : 'cream';
    const other = left === 'bean' ? 'cream' : 'bean';
    let msg;
    if (!addOnly && cfg.cream && (e.left[left] > 0) && Math.random() < 0.5) {
      const n = e.left[left];
      e.left[left] = 0; e.order[left] -= n;
      e.left[other] += n; e.order[other] += n;
      msg = `아니다! 남은 건 <span class="n">${other === 'cream' ? '슈크림' : '팥'}</span>으로 바꿀래요!`;
    } else {
      const k = addOnly ? (cfg.cream && Math.random() < 0.5 ? 'cream' : 'bean') : left;
      e.left[k] += 1; e.order[k] += 1;
      msg = `아 맞다! 친구 것까지 <span class="n">${k === 'cream' && cfg.cream ? '슈크림 ' : cfg.cream ? '팥 ' : ''}하나 더</span>요!`;
    }
    setBubble(msg);
    e.line = msg;
    play('bell', 0.4);
  }

  function complete(e) {
    const sp = e.sp ? SPECIALS[e.sp] : null;
    const ratio = e.wait / e.max;
    const cnt = e.order.bean + e.order.cream;
    let tip = ratio > 0.6 ? (sp && sp.tipEach ? sp.tipEach : cfg.tipEach ? cfg.tipEach(progress()) : 200) * cnt : 0;
    let sales = e.order.bean * cfg.price + e.order.cream * (cfg.price + CREAM_BONUS);
    let extra = 0, satBonus = 0, thanks = sp && sp.thanks;
    if (sp && sp.discount) sales = Math.round(sales * (1 - sp.discount) / 10) * 10;      // 윤이 엄마: 30% 싸게
    if (sp && sp.fixedPrice) { sales = sp.fixedPrice; tip = 0; }                          // 꼬마: 500원
    if (sp && sp.bonus) extra = sp.bonus;                                                   // 원장님: 단체 보너스
    if (sp && sp.satBonus) satBonus = sp.satBonus;
    if (sp && sp.free) { sales = 0; tip = 0; }                                              // 나그네: 무료
    if (sp && sp.couple && e.wrongOnce) { satBonus = 0; thanks = '…분위기 다 깨졌어. 그래도 맛은 있네.'; }
    if (sp && sp.noOrder) {                                                                 // 건물주: 용돈
      tip = Math.round((sp.gift[0] + Math.random() * (sp.gift[1] - sp.gift[0])) / 1000) * 1000; sales = 0;
    }
    if (sp && sp.happyImg && !(sp.couple && e.wrongOnce) && customerImgCache[e.def.id + '-happy']) e.img.src = customerImgCache[e.def.id + '-happy'].src;
    if (e.sp === 'grandpa') {
      if (!e.hide) thanks = '고맙네. 이게 내 단골 주문일세, 기억해 두게!';                           // 처음 온 날
      else if (!e.wrongOnce) { tip = Math.max(tip, 200 * cnt) * 2; satBonus = 3; }          // 기억했다!
      else thanks = '허허, 다음엔 기억해 주게.';
    }
    if (e.sp === 'auntie') { save.auntieMet = true; today.auntieHappy = true; buzzUntil = elapsed + 30; }
    if (e.sp === 'hyun') {
      save.hyunMet = true;
      // 엄마와 윤이가 모두 기분 좋게 다녀갔다면 가족 대표로 감사 인사
      if (save.auntieHappy || today.auntieHappy) { extra += 2000; thanks = '엄마랑 윤이가 여기 얘기만 해요! 가족 대표로 감사 인사예요. 충성!'; }
    }
    if (e.sp === 'yuni') save.yuniMet = true;
    if (e.sp === 'yuni') { if (today.auntieHappy || save.auntieHappy) tip = Math.round(Math.max(tip, 200 * cnt) * 1.5 / 10) * 10; else thanks = '감사합니다!'; }
    if (today.auntieHappy) save.auntieHappy = true;
    if (sp) { const rec = today.specials.find((x) => x.id === e.sp && x.ok === null); if (rec) rec.ok = true; }
    sales += extra;
    money += sales + tip;
    stats.sold += cnt;
    stats.sales += sales;
    stats.tips += tip;
    play('happy');
    if (sp && sp.noOrder) toast(`🍀 럭키! 건물주 용돈 +${won(tip)}`);
    else if (sp && sp.free) toast('나눔 완료! 동네에 좋은 소문이 나요');
    else toast(tip ? `+${won(sales + tip)} (팁 ${won(tip)})` : `+${won(sales)}`);
    e.state = 'thanks';
    e.t = 0;
    e.restoreAt = 0;
    setBubble(`<b>${thanks || THANKS[Math.floor(Math.random() * THANKS.length)]}</b>`);
    if (!(sp && sp.noOrder)) onServed(ratio, e.perfect);   // 건물주는 판 게 아니라서 만족도·콤보와 상관없다
    if (satBonus) changeSat(satBonus);
    if (extra) setTimeout(() => toast(e.sp === 'santa' ? `🎅 산타의 선물 +${won(extra)}!` : `단체 보너스 +${won(extra)}!`), 700);
  }

  function leave(e, happy) {
    const i = Q.indexOf(e);
    if (i < 0) return;
    Q.splice(i, 1);
    e.state = 'out';
    e.t = 0;
    e.dir = i === 0 ? 1 : -1;     // 맨 앞 손님은 오른쪽으로, 뒤 손님은 왼쪽으로 떠난다
    if (!happy && !e.def.noSad && customerImgCache[e.def.id + '-sad']) e.img.src = customerImgCache[e.def.id + '-sad'].src;
    e.tag.classList.add('gone');
    leaving.push(e);
    if (i === 0) frontReadyAt = elapsed + FRONT_DELAY;   // 다음 손님이 한 칸 앞으로 걸어 나오는 동안
    if (Q.length < cap()) arriveIn = Math.min(arriveIn, 1 + Math.random());
  }
  function leaveSad(e) {
    if (e.sp) { const rec = today.specials.find((x) => x.id === e.sp && x.ok === null); if (rec) rec.ok = false; }
    stats.missed++;
    play('sad', 0.7);
    const sp = e.sp ? SPECIALS[e.sp] : null;
    if (Q[0] === e) setBubble(`<span style="color:#7a6a5a">${sp && sp.leaveLine ? sp.leaveLine : '너무 오래 기다려서 그냥 갈게요...'}</span>`);
    onMissed(sp && sp.leavePenalty, !!sp);
    leave(e, false);
  }

  function updateQueue(dt) {
    if (elapsed < cfg.dayLength - 2) {
      arriveIn -= dt;
      if (arriveIn <= 0) {
        if (Q.length < cap()) { spawnQueued(); arriveIn = cfg.gap() * (elapsed < buzzUntil ? 0.6 : 1); }
        else arriveIn = 0.5;
      }
    }
    // 앞 손님이 떠난 자리로 다음 손님이 걸어 나오면 그 손님 말풍선을 띄운다
    const front = Q[0];
    if (front && front.state !== 'in' && elapsed >= frontReadyAt && bubbleOwner !== front) showFrontBubble(front);
    [...Q].forEach((e, i) => {
      e.t += dt;
      if (e.state === 'in' && e.t >= 0.6) { e.state = 'wait'; e.t = 0; }
      if (e.state === 'wait') {
        // 뒤에 설수록 한 자리마다 앞사람의 절반 속도로 인내심이 준다 (1, 1/2, 1/4, 1/8 ...)
        // 맨 앞 손님은 말풍선이 뜬 뒤부터 원래 속도
        const speed = i === 0 ? (bubbleOwner === e ? 1 : 0.5) : Math.pow(0.5, i);
        e.wait -= dt * speed;
        if (e.restoreAt && elapsed >= e.restoreAt) { e.restoreAt = 0; if (bubbleOwner === e) setBubble(lineHtml(e)); }
        if (i === 0 && bubbleOwner === e && e.sp && SPECIALS[e.sp].noOrder) { e.brag = (e.brag || 0) + dt; if (e.brag >= 3) { complete(e); return; } }
        if (e.wait <= 0) leaveSad(e);
      } else if (e.state === 'thanks' && e.t >= (e.sp && SPECIALS[e.sp].noOrder ? 1.6 : THANKS_WAIT)) {   // 건물주 인사는 조금 더 길게
        leave(e, true);
      }
    });
    leaving = leaving.filter((e) => {
      e.t += dt;
      if (e.t > 0.9) { e.el.remove(); e.tag.remove(); if (bubbleOwner === e) bubbleOwner = null; return false; }
      return true;
    });
  }
  function frontNeeds() {
    const e = Q[0];
    return e && e.state === 'wait' && bubbleOwner === e ? e.left : { bean: 0, cream: 0 };
  }

  // 손님 그림에서 투명하지 않은 부분의 가장 왼쪽 (줄마다). 뒤 손님 주문표가 앞 손님 그림을 덮지 않게 쓴다
  const alphaRows = {};
  function rowsFor(id) {
    if (alphaRows[id]) return alphaRows[id];
    const im = customerImgCache[id];
    if (!im || !im.complete || !im.naturalWidth) return null;
    const W = 128, H = 128, cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.drawImage(im, 0, 0, W, H);
    const data = ctx.getImageData(0, 0, W, H).data;
    const rows = new Int16Array(H).fill(W);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 40) { rows[y] = x; break; }
    return (alphaRows[id] = rows);
  }
  function visibleLeft(e, y0, y1) {
    const rows = rowsFor(e.def.id);
    const size = BOX * e.s, left = e.x + (BOX - size) / 2, top = COUNTER - e.up - size;
    if (!rows) return left + size * 0.15;
    let minX = 128;
    const a = Math.max(0, Math.floor((y0 - top) / size * 128)), b = Math.min(127, Math.ceil((y1 - top) / size * 128));
    for (let y = a; y <= b; y++) minX = Math.min(minX, rows[y]);
    return minX >= 128 ? Infinity : left + minX / 128 * size;
  }

  function renderQueue() {
    const now = performance.now();
    const dt = Math.min(0.1, (now - (lastRender || now)) / 1000);
    lastRender = now;
    const k = Math.min(1, dt * 7);
    Q.forEach((e, i) => {
      const slot = SLOTS[Math.min(i, 2)];
      const hidden = i >= SLOTS.length;
      const tx = hidden ? SLOTS[2].x - 60 : slot.x;
      e.x += (tx - e.x) * k; e.up += (slot.up - e.up) * k; e.s += (slot.s - e.s) * k; e.dim += (slot.dim - e.dim) * k;
      setStyle(e.el, 'display', hidden ? 'none' : '');
      setStyle(e.el, 'left', `${e.x.toFixed(1)}px`);
      setStyle(e.el, 'top', `${(COUNTER - BOX - e.up).toFixed(1)}px`);
      setStyle(e.el, 'transform', `scale(${e.s.toFixed(3)})`);
      setStyle(e.el, 'filter', e.dim > 0.99 ? '' : `brightness(${e.dim.toFixed(2)})`);
      // 겹치는 순서: 3번째 손님 → 3번째 주문표 → 2번째 손님 → 2번째 주문표 → 맨 앞 손님
      // (주문표는 자기 손님보다 위, 앞 손님보다 아래: 손님 6-2i, 주문표 7-2i)
      setStyle(e.el, 'zIndex', String(6 - i * 2));
      setStyle(e.tag, 'zIndex', String(7 - i * 2));
    });
    leaving.forEach((e) => {
      const p = Math.min(1, e.t / 0.9);
      setStyle(e.el, 'left', `${(e.x + e.dir * 90 * p).toFixed(1)}px`);
      setStyle(e.el, 'opacity', (1 - p).toFixed(2));
      setStyle(e.tag, 'display', 'none');
    });
    // 뒤 손님 주문표: 머리 위 가운데, 앞에 선 손님 그림의 보이는 왼쪽 끝을 넘지 않게
    let limit = Infinity;
    Q.forEach((e, i) => {
      if (i === 0 || i >= SLOTS.length || e.state === 'out') { setStyle(e.tag, 'display', 'none'); return; }
      setStyle(e.tag, 'display', '');
      const span = e.tag.firstChild, bar = e.tag.lastChild.firstChild;
      const text = e.hide ? '?' : (e.order.bean + e.order.cream) ? countText(e.order) : '💰';
      if (span.textContent !== text) span.textContent = text;
      const r = Math.max(0, e.wait / e.max);
      setStyle(bar, 'transform', `scaleX(${r.toFixed(3)})`);
      setStyle(bar, 'background', r > 0.6 ? '#5dbb63' : r > 0.3 ? '#f5a623' : '#e74c3c');
      const w = e.tag.offsetWidth, h = e.tag.offsetHeight;
      for (let j = 0; j < i; j++) limit = Math.min(limit, visibleLeft(Q[j], TAG_TOP, TAG_TOP + h) - 4);
      let x = e.x + BOX / 2 - w / 2;
      if (x + w > limit) x = limit - w;
      x = Math.max(4, x);
      setStyle(e.tag, 'left', `${x.toFixed(1)}px`);
      setStyle(e.tag, 'top', `${TAG_TOP}px`);
      limit = Math.min(limit, x - 5);
    });
    // 화면에 그리지 않은 손님 수: 줄의 맨 끝(가장 왼쪽)
    const more = Math.max(0, Q.length - SLOTS.length);
    const mt = more ? `+${more}` : '';
    if (moreEl.textContent !== mt) moreEl.textContent = mt;
    if (more) setStyle(moreEl, 'top', limit < 34 ? `${TAG_TOP + 26}px` : `${TAG_TOP + 3}px`);

    // 맨 앞 손님 말풍선
    const bubble = $('bubble');
    const owner = bubbleOwner;
    const show = owner && (Q.includes(owner) || leaving.includes(owner));
    setStyle(bubble, 'visibility', show ? 'visible' : 'hidden');
    if (show) {
      let bs = 1;
      if (bubblePopAt >= 0) { const t = (now - bubblePopAt) / 220; bs = t >= 1 ? 1 : 1 - Math.pow(1 - t, 3); if (t >= 1) bubblePopAt = -1; }
      if (leaving.includes(owner)) bs = Math.max(0, 1 - owner.t / 0.5);
      setStyle(bubble, 'transform', `scale(${bs.toFixed(3)})`);
      const r = owner.state === 'wait' ? Math.max(0, owner.wait / owner.max) : owner.state === 'thanks' ? owner.wait / owner.max : 0;
      const fill = $('patience-fill');
      setStyle(fill, 'width', `${(r * 100).toFixed(1)}%`);
      setStyle(fill, 'background', r > 0.6 ? '#5dbb63' : r > 0.3 ? '#f5a623' : '#e74c3c');
      const chip = $('order-chip');
      const ct = !(owner.order.bean + owner.order.cream) ? '💰'
        : owner.hide && owner.state === 'wait' ? countText(owner.order, owner.left).replace(/\d+/g, '?') : countText(owner.order, owner.left);
      if (chip.textContent !== ct) chip.textContent = ct;
    }
  }

  // ── 버튼 연결 ──
  const on = (id, fn) => $s(id).addEventListener('click', fn);
  on('story-btn', openMenu);
  on('story-continue', continueStory);
  on('story-new', newStory);
  on('story-rank', () => showRanking('story'));
  document.querySelectorAll('#rank-tabs button').forEach((b) => b.addEventListener('click', () => showRanking(b.dataset.board)));
  document.querySelectorAll('#rank-scope button').forEach((b) => b.addEventListener('click', () => { rankScope = b.dataset.scope; showRanking(); }));
  on('story-menu-close', () => showTitle());
  on('confirm-yes', beginNew);
  on('confirm-no', openMenu);
  on('story-intro', beginDay);
  on('sr-next', afterResult);
  on('shop-next', showIntro);
  $s('shop-list').addEventListener('click', (e) => { const b = e.target.closest('.shop-buy'); if (b) buy(b.dataset.id); });
  on('go-save', () => saveRank('go-name'));
  on('go-new', () => { beginNew(); });
  on('go-home', () => showTitle());
  on('end-save', () => saveRank('end-name'));   // 클릭 이벤트가 입력칸 id 자리로 넘어가지 않게
  on('end-home', () => showTitle());
  on('rank-close', () => showTitle());
  on('notice-close', () => $s('story-notice').classList.add('hidden'));
  // 장사 중에 처음 화면으로 나가면 그날 장사는 저장되지 않는다 (다음에 그날 아침부터)
  on('quit-btn', () => { if (today) { today = null; clearQueue(); refreshTitle(); } })

  boot();

  return {
    day: () => (today ? today.day : save ? save.day : 1),
    lockedHint: () => {
      const day = today ? today.day : 1;
      return day < 2 ? 'Day 2에 열리는 틀이에요' : 'Day 5에 열리는 틀이에요';
    },
    onServed, onMissed, onBurnt, renderHud, endDay, refreshTitle, showRanking, submitRank, beginChallenge, endChallenge,
    serve, updateQueue, renderQueue, frontNeeds,
    // 테스트·밸런스 확인용
    _debug: { set forceSpecial(v) { forceSpecial = v; }, spawnQueued: () => spawnQueued(), DAYS, UPGRADES, get Q() { return Q; }, get save() { return save; }, set save(v) { save = v; }, get today() { return today; }, persist, buildCfg, beginNew, beginDay, buy, showIntro },
  };
})();
