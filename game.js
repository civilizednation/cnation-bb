'use strict';

// ───────────────────────── 설정 ─────────────────────────
const BATTER_COST = 300;       // 반죽 한 번 붓는 재료비
const CREAM_COST = 100;        // 슈크림을 올릴 때 더 드는 재료비 (슈크림 붕어빵은 200원 더 받는다)
const SPRITE = 'assets/sprites/';
const SOUND = 'assets/sounds/';
const ALL_MOLDS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

// 모드마다 하루 장사 규칙이 다르다. progress는 그날 장사의 진행도(0~1).
// 3분 챌린지: 시간이 갈수록 빨리 익고(바빠지고) 손님은 덜 기다린다. 스토리 모드 설정은 story.js가 날짜별로 만든다.
// 3분 챌린지는 1분마다 단계가 확 바뀐다 (아침 → 저녁 → 밤). 단계가 바뀔 때 화면에 크게 알린다
const CH_STAGES = [
  { msg: '', cook: 5.0, burn: 6.0, patience: 30, need: [1, 2], gap: [1.6, 2.8], tip: 200, bgm: 1 },
  { msg: '🌇 2단계 · 저녁 손님이 몰려와요!', cook: 4.0, burn: 5.0, patience: 22, need: [1, 3], gap: [1.0, 1.8], tip: 300, bgm: 1.08 },
  { msg: '🌙 3단계 · 밤 러시! 마지막 1분!', cook: 3.2, burn: 4.0, patience: 15, need: [2, 4], gap: [0.5, 1.0], tip: 400, bgm: 1.15 },
];
const chStageIndex = (p) => Math.min(CH_STAGES.length - 1, Math.floor(p * CH_STAGES.length));
const chStage = (p) => CH_STAGES[chStageIndex(p)];
const randIn = ([a, b]) => a + Math.random() * (b - a);
const CHALLENGE = {
  dayLength: 180,                                   // 하루 장사 시간(초)
  price: 1000,                                      // 붕어빵 한 개 값
  bagMax: 9,
  molds: ALL_MOLDS,                                 // 쓸 수 있는 틀 (나머지는 잠김)
  cook: (p) => chStage(p).cook,                     // 한 면 익는 시간
  burn: (p) => chStage(p).burn,                     // 다 익은 뒤 타기까지
  patience: (p) => chStage(p).patience,
  need: (p) => { const [a, b] = chStage(p).need; return a + Math.floor(Math.random() * (b - a + 1)); },
  gap: () => randIn(chStage(progress()).gap),       // 손님이 떠나고 다음 손님이 올 때까지
  tipEach: (p) => chStage(p).tip,                   // 인내심이 60% 넘게 남았을 때 한 개당 팁
  stages: true,
  challenge: true,
  // 스토리 모드와 같은 줄 서기. 줄 길이: 0~20초 1명 → 20초~1분 2명 → 2단계 3명 → 3단계 5명
  queue: true,
  capacity: (t) => (t < 20 ? 1 : t < 60 ? 2 : t < 120 ? 3 : 5),
  firstGap: 1.2,
  variant: 'bean',                                  // 랭킹 이름: 3분 챌린지 팥
};
// 3분 챌린지 팥 & 슈크림: 같은 규칙에 슈크림 도구·봉투가 더해진다. 손님은 섞어서 주문하기도 한다.
// 스토리 모드와 같이 봉투를 한 번 누를 때마다 한 개씩 건넨다.
const CHALLENGE_MIX = Object.assign({}, CHALLENGE, { variant: 'mix', cream: true, creamRatio: 0.45, mixRatio: 0.35 });

// 주문 {bean, cream}을 말로: "2개" / "팥 2개" / "슈크림 1개" / "팥 2개랑 슈크림 1개"
function orderPhrase(o, withKind) {
  if (o.bean && o.cream) return `팥 ${o.bean}개랑 슈크림 ${o.cream}개`;
  if (o.cream) return `슈크림 ${o.cream}개`;
  return withKind ? `팥 ${o.bean}개` : `${o.bean}개`;
}
// 남은 개수 표시: "팥2 · 슈1", 다 받은 종류는 ✓ (hide: 개수를 숨기고 ?)
function countText(o, left, hide) {
  const parts = [];
  if (o.bean) parts.push(`팥${hide && left.bean ? '?' : left.bean || '✓'}`);
  if (o.cream) parts.push(`슈${hide && left.cream ? '?' : left.cream || '✓'}`);
  return parts.join(' · ');
}
function makeOrderFor(n) {
  if (!cfg.cream) return { bean: n, cream: 0 };
  if (n >= 2 && Math.random() < cfg.mixRatio) {
    const c = 1 + Math.floor(Math.random() * (n - 1));
    return { bean: n - c, cream: c };
  }
  return Math.random() < cfg.creamRatio ? { bean: 0, cream: n } : { bean: n, cream: 0 };
}

// ───────────────────────── 손님 만족도 (스토리 모드 · 3분 챌린지 공용 규칙) ─────────────────────────
// 오르기는 조건부·완만하게, 실수는 아프게. 80% 이상에서는 오르는 양이 절반
const SAT = { start: 70, fast: 2, normal: 1, slow: 0, late: -1, comboEvery: 5, combo: 1, perfect: 1,
  leave: -12, leaveSpecial: -15, burn: -3, wrong: -4, highAt: 80, highMul: 0.5 };
function satAdd(cur, delta) {
  if (delta > 0 && cur >= SAT.highAt) delta *= SAT.highMul;   // 높을수록 손님 기대치도 높다
  return Math.max(0, Math.min(100, cur + delta));
}
// 다 건넸을 때: 기다린 정도(70% 넘게 남음 빠름, 35~70% 보통, 15~35% 느림 0, 15% 미만 겨우 -1) + 5연속 콤보 + 완벽
function satServeDelta(ratio, combo, allPerfect) {
  let d = ratio > 0.7 ? SAT.fast : ratio > 0.35 ? SAT.normal : ratio > 0.15 ? SAT.slow : SAT.late;
  if (combo % SAT.comboEvery === 0) d += SAT.combo;
  if (allPerfect) d += SAT.perfect;
  return d;
}
let lastSatDrawn = null;
function drawSat(v) {
  if (lastSatDrawn !== null && Math.abs(v - lastSatDrawn) >= 0.5) {
    const d = v - lastSatDrawn, el = $('sat-delta');
    el.textContent = `${d > 0 ? '+' : ''}${Math.round(d) || (d > 0 ? '+0.5' : '-0.5')}`;
    el.className = d > 0 ? 'up' : 'down';
    void el.offsetWidth; el.classList.add('show');
    if (d < 0) { const pill = $('sat-text').parentElement; pill.classList.remove('hit'); void pill.offsetWidth; pill.classList.add('hit'); }
  }
  lastSatDrawn = v;
  $('sat-text').textContent = Math.round(v);
  $('sat-face').textContent = v >= 70 ? '😊' : v >= 40 ? '😐' : '😟';
  const f = $('sat-fill');
  f.style.width = `${v}%`;
  f.style.background = v >= 70 ? '#5dbb63' : v >= 40 ? '#f5a623' : '#e74c3c';
}
// 3분 챌린지 점수 = 순이익 × 만족도 배수 (0% ×0.5 … 50% ×1.0 … 100% ×1.5)
const satMultiplier = (sat) => 0.5 + Math.round(sat) / 100;

// ───────────────────────── 랭킹 (기기 안 상위 10개) ─────────────────────────
// story: 스토리 모드(엔딩 때 가진 돈) · bean: 3분 챌린지 팥 · mix: 3분 챌린지 팥 & 슈크림
// 3분 챌린지는 v1.5.3부터 점수(순이익 × 만족도 배수)로 매겨서 v2로 새로 시작한다 (v1 기록은 기기에 그대로 남아 있음)
const RANK_KEYS = { story: 'cnation-bb-story-rank-v1', bean: 'cnation-bb-rank-bean-v2', mix: 'cnation-bb-rank-mix-v2' };
const RANK_NAMES = { story: '스토리 모드', bean: '3분 챌린지 팥', mix: '3분 챌린지 팥 & 슈크림' };
const Ranks = {
  read(board) {
    try { const r = JSON.parse(localStorage.getItem(RANK_KEYS[board]) || '[]'); return Array.isArray(r) ? r : []; } catch { return []; }
  },
  // 넣었을 때 몇 등인지 (10등 밖이면 -1)
  place(board, money) {
    const r = Ranks.read(board);
    const i = r.findIndex((x) => money > x.money);
    const at = i < 0 ? r.length : i;
    return at < 10 ? at : -1;
  },
  add(board, entry) {
    const r = Ranks.read(board);
    r.push(entry);
    r.sort((a, b) => b.money - a.money || (b.sat || 0) - (a.sat || 0));
    const top = r.slice(0, 10);
    try { localStorage.setItem(RANK_KEYS[board], JSON.stringify(top)); } catch { /* 무시 */ }
    return top.indexOf(entry);
  },
  lastName() { try { return localStorage.getItem('cnation-bb-name') || ''; } catch { return ''; } },
  rememberName(n) { try { localStorage.setItem('cnation-bb-name', n); } catch { /* 무시 */ } },
};

// 반죽을 부으면 0.5초 동안 퍼지는 장면 (무늬 없는 반죽 → 팥을 올려도 무늬 없음 → 뒤집으면 무늬가 보인다)
const POUR_FRAMES = ['pour1.webp', 'pour2.webp', 'pour3.webp', 'pour4.webp', 'batter.webp'];
const POUR_TIME = 0.5;

const BREAD_IMG = {
  cream: 'batter-cream.webp',
  empty: 'mold.webp',
  batter: 'batter.webp',
  bean: 'batter-bean.webp',
  side1: 'fresh.webp',
  flip: 'soso.webp',
  side2: 'soso.webp',
  done: 'good.webp',
  burnt: 'burnt.webp',
};

// 동물 손님 16종 (3분 챌린지와 스토리 모드 일반 손님). 사람 손님은 스토리 모드 특별 손님(story.js SPECIALS).
// 손님마다 대사 5개를 번갈아 쓴다 (같은 손님이 바로 전에 한 대사는 다음에 나오지 않는다).
// {n}에는 주문("2개", 슈크림이 있는 날은 "팥 2개랑 슈크림 1개" 등)이 들어가므로, 대사에 팥·슈크림 같은 종류 이름은 넣지 않는다.
const CUSTOMERS = [
  { id: 'alpaca', lines: [
    '붕어빵 {n} 주세요~ 오늘 너무 춥네요.',
    '목도리를 둘러도 추워요. {n} 주세요!',
    '{n} 주세요~ 손이 꽁꽁 얼었어요.',
    '따끈한 걸로 {n} 부탁해요~',
    '털이 많아도 겨울은 추워요. {n}요!',
  ] },
  { id: 'deer', lines: [
    '붕어빵 {n} 바구니에 담아 주세요!',
    '숲속 친구들 줄 거예요. {n} 주세요!',
    '바구니가 텅 비었어요. {n} 채워 주세요~',
    '{n} 주세요! 뿔에 눈이 쌓였어요.',
    '오늘도 들렀어요. {n} 부탁해요!',
  ] },
  { id: 'hedgehog', lines: [
    '저기... 붕어빵 {n} 주실래요?',
    '저... {n}만 주시면 돼요...',
    '가시에 안 찔리게 조심히 {n}요...',
    '부끄럽지만... {n} 주세요.',
    '음... 오늘은 {n} 먹고 싶어요.',
  ] },
  { id: 'otter', lines: [
    '따끈한 붕어빵 {n} 주세요!',
    '{n} 주세요! 손에 꼭 쥐고 먹을래요.',
    '강가가 꽁꽁 얼었어요. {n}요!',
    '조개 대신 붕어빵! {n} 주세요~',
    '배 위에 올려 먹을 거예요. {n}요!',
  ] },
  { id: 'owl', lines: [
    '배달 가는 길이에요. 붕어빵 {n}!',
    '밤새 배달했어요. {n} 주세요!',
    '편지 배달 전에 {n} 먹고 갈게요.',
    '부엉~ {n} 빨리 부탁해요!',
    '동료들 것까지 {n} 주세요!',
  ] },
  { id: 'penguin', lines: [
    '붕어빵 {n} 포장해 주세요! 뒤뚱뒤뚱~',
    '{n} 주세요! 남극보다 여기가 더 추워요.',
    '뒤뚱뒤뚱 왔어요. {n}요!',
    '생선 대신 붕어빵! {n} 주세요~',
    '친구들이 기다려요. {n} 포장이요!',
  ] },
  { id: 'rabbit', lines: [
    '와, 냄새 좋다! 붕어빵 {n} 주세요!',
    '귀가 쫑긋! {n} 주세요~',
    '당근보다 붕어빵! {n}요!',
    '깡총깡총 뛰어왔어요. {n} 주세요!',
    '귀마개를 해도 추워요. {n}요~',
  ] },
  { id: 'seal', lines: [
    '속이 꽉 찬 붕어빵 {n} 주세요!',
    '모자 쓰고 왔어요. {n} 주세요!',
    '얼음 위보다 여기가 따뜻해요. {n}요!',
    '박수 짝짝! {n} 주세요~',
    '데굴데굴 굴러왔어요. {n}요!',
  ] },
  { id: 'cat', lines: [
    '냐옹~ 붕어빵 {n} 주세요!',
    '생선 모양이라 그냥 못 지나쳐요. {n}요!',
    '가방에 쏙 넣어 갈게요. {n} 주세요~',
    '수염까지 얼었어요. {n}요!',
    '따끈한 거 {n} 주시면 골골송 불러 드릴게요~',
  ] },
  { id: 'dog', lines: [
    '멍! 붕어빵 {n} 주세요!',
    '냄새 따라 달려왔어요! {n}요!',
    '꼬리가 저절로 흔들려요. {n} 주세요~',
    '산책 끝나고 먹을 거예요. {n}요!',
    '털모자 써도 귀가 시려요. {n} 주세요!',
  ] },
  { id: 'bear', lines: [
    '겨울잠 자기 전에 {n} 먹고 갈게요.',
    '꿀 대신 붕어빵! {n} 주세요~',
    '배가 너무 고파요. {n}요!',
    '조끼 주머니에 넣어 갈게요. {n} 주세요!',
    '느긋하게 기다릴게요. {n}요~',
  ] },
  { id: 'fox', lines: [
    '눈이 반짝! 붕어빵 {n} 주세요~',
    '꼬리로 몸 감싸도 추워요. {n}요!',
    '소문 듣고 왔어요. {n} 주세요!',
    '제일 노릇한 걸로 {n}요~',
    '헤헤, 오늘도 왔어요. {n} 주세요!',
  ] },
  { id: 'panda', lines: [
    '대나무보다 붕어빵! {n} 주세요~',
    '귀마개 하고 왔어요. {n}요!',
    '데굴데굴 굴러왔어요. {n} 주세요~',
    '한 입만 먹고 싶었는데… {n}요!',
    '포근한 붕어빵 {n} 부탁해요~',
  ] },
  { id: 'koala', lines: [
    '음… 졸려요… {n} 주세요…',
    '나무에서 내려왔어요. {n}요~',
    '목도리 두르고 왔어요. {n} 주세요!',
    '천천히… 하지만 따끈하게 {n}요…',
    '잠 깨는 데는 붕어빵이죠. {n} 주세요!',
  ] },
  { id: 'duck', lines: [
    '꽥! 붕어빵 {n} 주세요!',
    '연못이 꽁꽁 얼었어요. {n}요!',
    '뒤뚱뒤뚱 왔어요. {n} 주세요~',
    '모자 쓰고 멋 부렸어요. {n}요!',
    '꽥꽥! 빨리 {n} 주세요!',
  ] },
  { id: 'squirrel', lines: [
    '도토리 대신 붕어빵! {n} 주세요~',
    '겨울 간식으로 {n} 모아 둘래요!',
    '볼에 쏙 넣어 갈게요. {n}요!',
    '꼬리까지 시려요. {n} 주세요~',
    '나무 위에서 냄새 맡고 왔어요. {n}요!',
  ] },
];
// 그 손님의 대사 하나를 고른다 (바로 전에 한 대사는 빼고)
const lastLine = {};
function pickLine(def) {
  const pool = def.lines.filter((l) => l !== lastLine[def.id]);
  const line = pool[Math.floor(Math.random() * pool.length)];
  lastLine[def.id] = line;
  return line;
}
const THANKS = ['와! 따끈따끈해서 최고예요!', '고마워요, 또 올게요!', '냄새부터 맛있네요~', '이 집 붕어빵이 최고야!'];

// ───────────────────────── 화면 크기 맞추기 ─────────────────────────
const stage = document.getElementById('stage');
function fit() {
  const s = Math.min(window.innerWidth / 360, window.innerHeight / 640);
  stage.style.transform = `scale(${s})`;
}
window.addEventListener('resize', fit);
fit();

// ───────────────────────── 소리 ─────────────────────────
// 효과음은 Web Audio로 미리 풀어 두고 GainNode로 음량을 정한다.
// iOS Safari는 audio.volume을 무시하고, 매번 <audio>를 복제하면 소리가 늦게 나기 때문이다.
// 배경음악도 GainNode를 거치게 해서 iOS에서 음량이 맞게 나오도록 한다.
// Web Audio가 없거나 index.html을 파일로 직접 열었으면(file://) 예전처럼 <audio>로 재생한다.
const SFX_NAMES = ['pour', 'bean', 'flip', 'burn', 'collect', 'bag', 'happy', 'sad', 'bell', 'start'];
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const actx = AudioCtx && location.protocol !== 'file:' ? new AudioCtx() : null;
const sfxBuffers = {};
const sfxEls = {};
// 로딩 화면이 끝날 때까지 기다리는 효과음 목록
const sfxReady = SFX_NAMES.map((name) => {
  if (!actx) { sfxElement(name); return Promise.resolve(); }
  return fetch(SOUND + name + '.mp3')
    .then((r) => r.arrayBuffer())
    .then((data) => new Promise((ok, fail) => actx.decodeAudioData(data, ok, fail)))
    .then((buf) => { sfxBuffers[name] = buf; })
    .catch(() => {});
});
function sfxElement(name) {
  if (!sfxEls[name]) {
    sfxEls[name] = new Audio(SOUND + name + '.mp3');
    sfxEls[name].preload = 'auto';
  }
  return sfxEls[name];
}

// 배경음악은 가벼운 webm(Opus)을 쓰고, 재생하지 못하는 브라우저(구형 iOS Safari 등)만 mp3를 받는다
const BGM_EXT = new Audio().canPlayType('audio/webm; codecs="opus"') ? '.webm' : '.mp3';
function makeBgm(name, volume) {
  const el = new Audio();
  el.loop = true;
  el.preload = 'none';
  el.bgmUrl = SOUND + name + BGM_EXT;
  el.bgmVolume = volume;
  if (actx) {
    const src = actx.createMediaElementSource(el);
    el.bgmGain = actx.createGain();
    src.connect(el.bgmGain);
    el.bgmGain.connect(actx.destination);
  } else {
    el.volume = volume;
  }
  return el;
}
// 장사 음악은 3곡 중 하나를 날마다 무작위로 고른다 (전날과 같은 곡은 피한다)
const GAME_TRACKS = ['game1', 'game2', 'game3'];
const bgm = { title: makeBgm('bgm-title', 0.4) };
GAME_TRACKS.forEach((k) => { bgm[k] = makeBgm('bgm-' + k, 0.4); });
let nextGameTrack = pickGameTrack(null);

function pickGameTrack(prev) {
  const pool = GAME_TRACKS.filter((k) => k !== prev);
  return pool[Math.floor(Math.random() * pool.length)];
}
// 음악 파일을 통째로 받아 둔다. iPhone은 preload 설정을 무시해서, 재생할 때가 돼서야
// 받기 시작하면 음악이 한참 늦게 나온다.
function loadBgm(k) {
  const el = bgm[k];
  if (!el.bgmLoading) {
    el.bgmLoading = fetch(el.bgmUrl)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); })
      .then((blob) => { if (!el.src) el.src = URL.createObjectURL(blob); })
      .catch(() => { if (!el.src) el.src = el.bgmUrl; });
  }
  return el.bgmLoading;
}
// 음악이 갑자기 크게 시작하지 않도록 서서히 키운다
function fadeIn(el, sec) {
  if (!el.bgmGain) return;
  const g = el.bgmGain.gain, t = actx.currentTime;
  g.cancelScheduledValues(t);
  g.setValueAtTime(0, t);
  g.linearRampToValueAtTime(el.bgmVolume, t + sec);
}
let soundOn = localStorage.getItem('bb-sound') !== 'off';
let currentBgm = null;

function play(name, volume = 0.8) {
  if (!soundOn) return;
  if (actx && sfxBuffers[name]) {
    const src = actx.createBufferSource();
    const gain = actx.createGain();
    src.buffer = sfxBuffers[name];
    gain.gain.value = volume;
    src.connect(gain);
    gain.connect(actx.destination);
    src.start();
    return;
  }
  const a = sfxElement(name).cloneNode();   // 아직 풀리지 않았거나 Web Audio가 없을 때
  a.volume = volume;
  a.play().catch(() => {});
}
// restart: 다른 곡에서 넘어올 때 처음부터 튼다 (같은 곡이 이미 나오고 있으면 그대로 둔다)
function playBgm(which, restart = false) {
  const changed = currentBgm !== which;
  currentBgm = which;
  for (const k in bgm) if (k !== which) bgm[k].pause();
  if (!which) return;
  const el = bgm[which];
  if (!el.src) el.src = el.bgmUrl;   // 아직 다 못 받았으면 받으면서 바로 튼다
  if (restart && changed) el.currentTime = 0;
  if (!soundOn || paused) return;    // 일시정지 중에는 틀지 않는다
  if (el.paused) {
    fadeIn(el, which === 'title' ? 1.5 : 1.2);
    el.play().catch(() => {});
  }
}
function setSound(on) {
  soundOn = on;
  localStorage.setItem('bb-sound', on ? 'on' : 'off');
  // 장사 화면과 타이틀 화면의 소리 버튼을 함께 바꾼다
  document.querySelectorAll('.sound-toggle').forEach((b) => { b.textContent = on ? '🔊' : '🔇'; });
  if (on) playBgm(currentBgm); else for (const k in bgm) bgm[k].pause();
}

// 모바일은 터치 전에는 소리를 낼 수 없다. iPhone은 누르는 순간(pointerdown)이 아니라
// 손을 뗄 때(touchend·click)만 소리를 켜도 되는 터치로 인정하므로 그때 소리를 깨운다.
function unlockAudio() {
  if (actx && actx.state !== 'running') actx.resume().catch(() => {});
}
['touchend', 'pointerup', 'click'].forEach((type) => document.addEventListener(type, unlockAudio, true));

// ───────────────────────── 화면 요소 ─────────────────────────
const $ = (id) => document.getElementById(id);
const grillEl = $('grill');
const molds = [];
for (let i = 0; i < 9; i++) {
  const el = document.createElement('div');
  el.className = 'mold';
  el.innerHTML = `<img src="${SPRITE}mold.webp" alt=""><div class="bar"><i></i></div><span class="tag"></span><span class="kind"></span>`;
  grillEl.appendChild(el);
  molds.push({
    el,
    img: el.querySelector('img'),
    bar: el.querySelector('.bar'),
    fill: el.querySelector('.bar i'),
    tag: el.querySelector('.tag'),
    kindEl: el.querySelector('.kind'),
    kind: 'bean',
    state: 'empty',
    t: 0,          // 지금 상태에 머문 시간
    flipAt: -1,    // 뒤집기 연출 시작 시각
    shown: '',
  });
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); onMold(i); });
}

const tools = [...document.querySelectorAll('.tool')];
tools.forEach((btn) => btn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  selectTool(btn.dataset.tool);
}));
$('bag').addEventListener('pointerdown', (e) => { e.preventDefault(); onBag('bean'); });
$('bag-cream').addEventListener('pointerdown', (e) => { e.preventDefault(); onBag('cream'); });
document.querySelectorAll('.sound-toggle').forEach((b) => b.addEventListener('click', () => setSound(!soundOn)));
$('pause-btn').addEventListener('click', () => pauseGame());
$('resume-btn').addEventListener('click', () => resumeGame());
$('restart-btn').addEventListener('click', () => { closePause(); startChallenge(); });
$('quit-btn').addEventListener('click', () => { closePause(); running = false; showTitle(); });
$('start-btn').addEventListener('click', () => showChallengeMenu());
$('ch-bean').addEventListener('click', () => startChallenge('bean'));
$('ch-mix').addEventListener('click', () => startChallenge('mix'));
$('ch-close').addEventListener('click', () => showTitle());
$('ch-rank').addEventListener('click', () => Story.showRanking('bean'));
$('rank-btn').addEventListener('click', () => Story.showRanking('story'));
$('r-save').addEventListener('click', () => { $('r-save').disabled = true; saveChallengeRank(); });
$('again-btn').addEventListener('click', () => startChallenge());
$('help-btn').addEventListener('click', () => $('help').classList.remove('hidden'));
$('help-close').addEventListener('click', () => $('help').classList.add('hidden'));
$('history-btn').addEventListener('click', () => $('history').classList.remove('hidden'));
$('history-close').addEventListener('click', () => $('history').classList.add('hidden'));

// 버전 표시와 업데이트 기록 (내용은 version.js)
$('version-text').textContent = VERSION;
$('history-list').innerHTML = CHANGELOG.map((r) => `
  <div class="history-item">
    <h3>v${r.version}<small>${r.date}</small></h3>
    <ul>${r.notes.map((n) => `<li>${n}</li>`).join('')}</ul>
  </div>`).join('');
$('home-btn').addEventListener('click', () => showTitle());

// ───────────────────────── 게임 상태 ─────────────────────────
let hudMode = 'challenge';   // 위쪽 만족도 칸이 어느 모드 값을 보여 주는지 (장사가 끝나도 정산 화면까지 유지)
let mode = 'challenge';        // 'challenge' (3분 챌린지) | 'story'
let cfg = CHALLENGE;
let running = false;
let paused = false;
let elapsed = 0;
let tool = 'batter';
let bagCount = 0;
let bagPerfect = [];           // 봉투 속 붕어빵마다 "완벽하게 구웠는지" (먼저 넣은 것부터)
let creamPerfect = [];         // 슈크림 봉투 (스토리 모드 Day 4부터). 길이가 곧 개수
let money = 0;
const stats = { sold: 0, sales: 0, tips: 0, cost: 0, burnt: 0, missed: 0 };
// 3분 챌린지 만족도 (스토리 모드는 story.js의 today.sat)
let chSat = SAT.start, chCombo = 0, chOut = false, chStageNow = 0;
function chChange(delta) {
  chSat = satAdd(chSat, delta);
  if (chSat <= 0 && running) chOut = true;      // 0%가 되면 3분 전이라도 장사를 마친다
}
let customer = null;           // { def, need, wait, max, phase, t }
let nextCustomerIn = 0;
let toastUntil = 0;

function progress() { return Math.min(1, elapsed / cfg.dayLength); }

function selectTool(name) {
  if (tool !== name) play('bag', 0.35);
  tool = name;
  tools.forEach((btn) => {
    const on = btn.dataset.tool === name;
    btn.classList.toggle('on', on);
    const img = btn.querySelector('img');
    const src = on ? img.dataset.on : img.dataset.off;
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
  });
}

function toast(text) {
  const el = $('toast');
  el.textContent = text;
  toastUntil = elapsed + 1.4;
}

function setStyle(el, prop, value) {
  if (el.style[prop] !== value) el.style[prop] = value;
}

function setMold(m, state) {
  m.state = state;
  m.t = 0;
}

function onMold(i) {
  if (!running) return;
  const m = molds[i];
  if (m.locked) return hint(mode === 'story' ? Story.lockedHint() : '아직 쓸 수 없는 틀이에요');
  if (elapsed - m.flipAt < 0.22) return;          // 뒤집는 중
  switch (m.state) {
    case 'empty':
      if (tool !== 'batter') return hint(tool === 'stick' ? '빈 틀이에요. 반죽부터 부어요' : '반죽부터 부어요');
      play('pour');
      stats.cost += BATTER_COST;
      money -= BATTER_COST;
      setMold(m, 'pouring');
      break;
    case 'pouring':
    case 'batter':
      // 팥이나 슈크림을 올린다 (퍼지는 중에 눌러도 기다리지 않고 바로 올린다)
      if (tool === 'bean' || (tool === 'cream' && cfg.cream)) {
        play('bean');
        if (tool === 'cream') { stats.cost += CREAM_COST; money -= CREAM_COST; }
        m.kind = tool;
        setMold(m, tool);
        break;
      }
      return hint(m.state === 'pouring' ? '반죽을 붓는 중이에요' : cfg.cream ? '팥이나 슈크림을 올려요' : '팥을 올려요');
    case 'bean':
    case 'cream':
      if (tool !== 'stick') return hint('꼬챙이로 뒤집어요');
      play('flip');
      m.flipAt = elapsed;
      setMold(m, 'side1');
      break;
    case 'side1':
    case 'side2':
      return hint('아직 굽는 중이에요');
    case 'flip':
      if (tool !== 'stick') return hint('꼬챙이로 한 번 더 뒤집어요');
      play('flip');
      m.flipAt = elapsed;
      setMold(m, 'side2');
      break;
    case 'done':
      if (tool !== 'stick') return hint('꼬챙이로 봉투에 담아요');
      if (m.kind === 'cream') {
        if (creamPerfect.length >= cfg.bagMax) return hint('슈크림 봉투가 꽉 찼어요');
        creamPerfect.push(m.t <= 1);
      } else {
        if (bagCount >= cfg.bagMax) return hint(cfg.cream ? '팥 봉투가 꽉 찼어요' : '봉투가 꽉 찼어요');
        bagCount++;
        bagPerfect.push(m.t <= 1);                // "다 익었어요!" 뜬 뒤 1초 안에 꺼내면 완벽
      }
      play('collect');
      setMold(m, 'empty');
      break;
    case 'burnt':
      if (tool !== 'stick') return hint('꼬챙이로 탄 붕어빵을 치워요');
      play('bag', 0.5);
      setMold(m, 'empty');
      break;
  }
}

function hint(text) {
  toast(text);
}

// ───────────────────────── 손님 ─────────────────────────
// 최근에 온 손님은 다시 뽑지 않는다 (손님이 적어져도 고를 손님이 최소 1명은 남게)
const RECENT_CUSTOMERS = 2;
const recentCustomers = [];
function pickCustomer() {
  const keep = Math.min(RECENT_CUSTOMERS, CUSTOMERS.length - 1);
  const pool = CUSTOMERS.filter((c) => !recentCustomers.slice(-keep).includes(c.id));
  const def = pool[Math.floor(Math.random() * pool.length)];
  recentCustomers.push(def.id);
  if (recentCustomers.length > RECENT_CUSTOMERS) recentCustomers.shift();
  return def;
}

// 손님 그림은 처음에 모두 받아 둔다. 그림을 그때그때 받으면, 다 받기 전까지
// 브라우저가 이전 손님 그림을 그대로 보여 줘서 이전 손님이 잠깐 비친다.
const customerImgCache = {};
CUSTOMERS.forEach((c) => [c.id, c.id + '-sad'].forEach((name) => {
  if (name.endsWith('-sad') && c.noSad) return;
  const im = new Image();
  im.src = SPRITE + name + '.webp';
  customerImgCache[name] = im;
}));
// 스토리 모드 특별 손님(사람) 그림도 미리 받아 둔다 (평소 / -sad 실망 / -happy 받고 기뻐함)
['courier', 'principal', 'grandpa', 'girl', 'boy', 'auntie', 'yuni', 'hyun', 'couple', 'tourist']
  .flatMap((id) => [id, id + '-sad'])
  .concat(['beggar', 'beggar-happy', 'landlord', 'landlord-happy', 'santa', 'santa-happy'])
  .forEach((name) => {
    const im = new Image();
    im.src = SPRITE + name + '.webp';
    customerImgCache[name] = im;
  });
let customerImgToken = 0;
// 그림을 완전히 그릴 수 있게 된 다음에 바꾼다 (늦게 끝난 이전 요청은 무시)
function setCustomerImg(name, onReady) {
  const token = ++customerImgToken;
  const pre = customerImgCache[name] || Object.assign(new Image(), { src: SPRITE + name + '.webp' });
  const apply = () => {
    if (token !== customerImgToken) return;
    $('customer-img').src = pre.src;
    if (onReady) onReady();
  };
  if (pre.decode) pre.decode().then(apply, apply);
  else if (pre.complete) apply();
  else pre.onload = pre.onerror = apply;
}

// 말풍선 글자를 풍선 안에 맞춘다. 넘치면 글자를 13px까지 줄여 보고, 그래도 넘치면
// 말풍선을 세로로 키운다(긴 대사용). 그래도 넘칠 때만 글자를 더 줄인다.
// 그림 속 흰 풍선은 세로 5~65%뿐이라(아래는 꼬리) 위아래 여백도 높이에 맞춰 바꾼다.
const BUBBLE_HEIGHTS = [128, 150, 172];
function setBubble(html) {
  const t = $('bubble-text'), b = $('bubble');
  t.innerHTML = html;
  t.style.fontSize = '';
  const base = parseFloat(getComputedStyle(t).fontSize);
  const fits = () => {
    const cs = getComputedStyle(b);
    const avail = b.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - $('bubble-row').offsetHeight - 8;
    return t.scrollWidth <= t.clientWidth + 1 && t.offsetHeight <= avail;
  };
  for (const h of BUBBLE_HEIGHTS) {
    b.style.height = h + 'px';
    b.style.paddingTop = Math.round(h * 0.046 + 8) + 'px';
    b.style.paddingBottom = Math.round(h * 0.35 + 5) + 'px';
    let size = base;
    t.style.fontSize = '';
    while (size > 13 && !fits()) t.style.fontSize = (size -= 0.5) + 'px';
    if (fits()) return;
  }
  let size = parseFloat(t.style.fontSize || base);
  while (size > 10.5 && !fits()) t.style.fontSize = (size -= 0.5) + 'px';
}

function spawnCustomer() {
  const def = pickCustomer();
  const p = progress();
  const need = cfg.need(p);
  const max = cfg.patience(p);
  const order = makeOrderFor(need);
  const c = { def, need, order, left: { ...order }, wait: max, max, phase: 'in', t: 0, mood: 'normal', ready: false, perfect: true };
  customer = c;
  setCustomerImg(def.id, () => { c.ready = true; });   // 그림이 준비될 때까지는 숨겨 둔다
  c.lineHtml = pickLine(def).replace('{n}', `<span class="n">${orderPhrase(order, cfg.cream)}</span>`);
  setBubble(c.lineHtml);
  play('bell', 0.5);
}

function customerLeaves(happy) {
  customer.phase = 'out';
  customer.t = 0;
  if (!happy) {
    customer.mood = 'sad';
    if (!customer.def.noSad) setCustomerImg(customer.def.id + '-sad');
  }
  nextCustomerIn = cfg.gap();
}

function onBag(kind = 'bean') {
  if (!running) return;
  if (cfg.queue) return Story.serve(kind);       // 스토리 모드: 줄 선 손님에게 한 개씩
  play('bag');
  if (!customer || customer.phase !== 'wait') return hint('손님이 아직 없어요');
  const c = customer;
  const want = c.left[kind];
  if (!want) {
    if (c.order[kind]) return hint('그건 이미 다 드렸어요');
    play('sad', 0.6);
    chChange(SAT.wrong);
    setBubble('<span style="color:#c0392b">그건 안 시켰어요!</span>');
    c.restoreAt = elapsed + 1.1;
    return;
  }
  // 스토리 모드와 같이 봉투를 한 번 누를 때마다 한 개씩 건넨다
  const bag = kind === 'cream' ? creamPerfect : bagPerfect;
  if (!bag.length) return hint(`${cfg.cream ? (kind === 'cream' ? '슈크림 ' : '팥 ') : ''}봉투가 비었어요`);
  if (!bag.shift()) c.perfect = false;
  if (kind === 'bean') bagCount = bagPerfect.length;
  c.left[kind]--;
  if (c.left.bean || c.left.cream) { play('collect', 0.5); return; }   // 아직 남았다
  const ratio = c.wait / c.max;
  const tip = ratio > 0.6 ? cfg.tipEach(progress()) * c.need : 0;
  chCombo++;
  chChange(satServeDelta(ratio, chCombo, c.perfect));
  if (chCombo % SAT.comboEvery === 0) setTimeout(() => toast(`🔥 ${chCombo}콤보! 만족도 보너스`), 650);
  const sales = c.order.bean * cfg.price + c.order.cream * (cfg.price + 200);
  const earned = sales + tip;
  money += earned;
  stats.sold += c.need;
  stats.sales += sales;
  stats.tips += tip;
  play('happy');
  setBubble(`<b>${THANKS[Math.floor(Math.random() * THANKS.length)]}</b>`);
  toast(tip ? `+${earned.toLocaleString()}원 (팁 ${tip}원)` : `+${earned.toLocaleString()}원`);
  customerLeaves(true);
}

// ───────────────────────── 하루 흐름 ─────────────────────────
const SCREENS = ['title', 'result', 'help', 'history', 'challenge-menu'];   // story.js가 스토리 화면을 더한다
function hideScreens() { SCREENS.forEach((id) => $(id).classList.add('hidden')); }

// 3분 챌린지 시작
let challengeVariant = 'bean';
function startChallenge(variant = challengeVariant) {
  challengeVariant = variant;
  mode = 'challenge';
  cfg = variant === 'mix' ? CHALLENGE_MIX : CHALLENGE;
  startDay(0);
  Story.beginChallenge();
}

// startMoney: 장사를 시작할 때 가진 돈 (3분 챌린지는 0, 스토리는 그날 아침 돈)
function startDay(startMoney = 0) {
  hideScreens();
  document.body.classList.toggle('story-mode', mode === 'story');
  hudMode = mode;
  lastSatDrawn = null;
  running = true;
  elapsed = 0;
  bagCount = 0;
  bagPerfect = [];
  creamPerfect = [];
  money = startMoney;
  document.body.classList.toggle('queue-mode', !!cfg.queue);
  document.body.classList.toggle('has-cream', !!cfg.cream);
  Object.keys(stats).forEach((k) => { stats[k] = 0; });
  molds.forEach((m, i) => { setMold(m, 'empty'); m.flipAt = -1; m.kind = 'bean'; m.locked = !cfg.molds.includes(i); });
  customer = null;
  $('bubble-name').textContent = '';   // 스토리 특별 손님 이름표가 다음 장사(3분 챌린지 등)에 남지 않게
  chSat = SAT.start; chCombo = 0; chOut = false; chStageNow = 0;
  setBgmRate(1);
  $('stage-banner').classList.remove('show');
  nextCustomerIn = cfg.firstGap;
  toastUntil = 0;
  selectTool('batter');
  play('start');
  playBgm(nextGameTrack, true);
}

// 3분 챌린지 랭킹에 이름 남기기
let pendingRank = null;
function saveChallengeRank() {
  if (!pendingRank) return;
  const name = ($('r-name').value || '').trim().slice(0, 8) || '이름 없음';
  Ranks.rememberName(name);
  const entry = { name, money: pendingRank.money, net: pendingRank.net, sat: pendingRank.sat, sold: pendingRank.sold, date: new Date().toISOString().slice(0, 10) };
  const at = Ranks.add(pendingRank.board, entry);   // 내 기기 10위 밖이면 -1
  const board = pendingRank.board;
  pendingRank = null;
  Story.submitRank(board, entry, at);
}

// 장사가 끝났을 때 팔지 못한 붕어빵 (봉투 속 + 철판 위 다 익은 것). 보상은 없고 안내만 한다
function leftoverText() {
  const n = bagCount + creamPerfect.length + molds.filter((m) => m.state === 'done').length;
  return n ? `붕어빵 ${n}개가 남아서 동네 이웃에게 나눠 줬어요. 재료비는 날렸지만 기분은 나쁘지 않아요~` : '';
}

function endDay() {
  running = false;
  setBgmRate(1);
  play('start');
  playBgm(null);
  if (mode === 'story') {
    // 스토리 모드: 정산·상점은 story.js
    setTimeout(() => { if (!running && currentBgm === null) playBgm('title', true); }, 1200);
    nextGameTrack = pickGameTrack(nextGameTrack);
    loadBgm(nextGameTrack);
    return Story.endDay();
  }
  Story.endChallenge();
  // 마감 소리가 끝나면 정산 화면에 시작 화면 음악을 처음부터 깔아 준다
  setTimeout(() => { if (!running && currentBgm === null) playBgm('title', true); }, 1200);
  nextGameTrack = pickGameTrack(nextGameTrack);
  loadBgm(nextGameTrack);   // 보통은 이미 받아 뒀다
  const net = money;
  const board = cfg.variant || 'bean';
  const sat = Math.round(chSat), mult = satMultiplier(sat);
  const score = net > 0 ? Math.round(net * mult) : net;     // 랭킹은 이 점수로 매긴다
  const place = score > 0 ? Ranks.place(board, score) : -1;
  // 전체(온라인) 10위 안이면 내 기기 10위 밖이어도 올릴 수 있다 (목록을 아직 못 받았으면 일단 올릴 수 있게)
  const online = score > 0 ? Online.qualifies(board, score) : false;
  pendingRank = place >= 0 || online !== false ? { board, money: score, net, sat, sold: stats.sold } : null;
  $('r-title').textContent = `3분 챌린지 ${board === 'mix' ? '팥 & 슈크림' : '팥'} 정산`;
  $('r-sold').textContent = `${stats.sold}개`;
  $('r-sales').textContent = `+${stats.sales.toLocaleString()}원`;
  $('r-tips').textContent = `+${stats.tips.toLocaleString()}원`;
  $('r-cost').textContent = `-${stats.cost.toLocaleString()}원`;
  $('r-miss').textContent = `${stats.burnt}개 · ${stats.missed}명`;
  $('r-total').textContent = `${net.toLocaleString()}원`;
  $('r-sat').textContent = `${sat}% (×${mult.toFixed(2)})`;
  $('r-score').textContent = `${score.toLocaleString()}점`;
  const top = Ranks.read(board)[0];
  const onTop = (Online.cached(board) || [])[0];
  $('r-best').textContent = onTop && score > onTop.money ? '🌏 전체 1위 기록이에요!'
    : online === true ? '🌏 전체 랭킹에 오를 수 있어요!'
    : place === 0 ? '🎉 내 최고 기록이에요!' : place > 0 ? `🏅 내 기기 랭킹 ${place + 1}위에 오를 수 있어요!`
    : onTop ? `전체 1위 기록 ${onTop.money.toLocaleString()}점` : top ? `1위 기록 ${top.money.toLocaleString()}점` : '';
  $('r-rank').classList.toggle('hidden', !pendingRank);
  $('r-name').value = Ranks.lastName();
  $('r-save').disabled = false;
  $('r-leftover').textContent = (chOut ? '😟 손님 만족도가 0%가 되어 장사를 일찍 마쳤어요. ' : '') + leftoverText();
  $('result').classList.remove('hidden');
}

// ───────────────────────── 일시정지 ─────────────────────────
function pauseGame() {
  if (!running || paused) return;
  paused = true;
  play('bag', 0.4);
  for (const k in bgm) bgm[k].pause();
  const left = Math.max(0, Math.ceil(cfg.dayLength - elapsed));
  const head = mode === 'story' ? `Day ${Story.day()} · ` : '';
  $('pause-time').textContent = `${head}남은 시간 ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  // 스토리 모드에서는 "처음부터 다시 하기"를 숨긴다 (다시 하기는 게임 오버 때 한 번뿐)
  $('restart-btn').classList.toggle('hidden', mode === 'story');
  $('quit-note').classList.toggle('hidden', mode !== 'story');
  $('pause').classList.remove('hidden');
}
function closePause() {
  paused = false;
  $('pause').classList.add('hidden');
}
function resumeGame() {
  if (!paused) return;
  closePause();
  play('bag', 0.4);
  playBgm(currentBgm);
}

function showChallengeMenu() {
  hideScreens();
  const best = (b) => { const t = Ranks.read(b)[0]; return t ? `1위 ${t.money.toLocaleString()}점` : '아직 기록 없음'; };
  $('ch-bean-best').textContent = best('bean');
  $('ch-mix-best').textContent = best('mix');
  $('challenge-menu').classList.remove('hidden');
}

function showTitle() {
  running = false;
  hideScreens();
  $('title').classList.remove('hidden');
  $('best-text').textContent = '';
  playBgm('title');
}

// ───────────────────────── 매 프레임 ─────────────────────────
function update(dt) {
  elapsed += dt;
  const p = progress();
  const cook = cfg.cook(p), burn = cfg.burn(p);

  molds.forEach((m) => {
    if (m.locked) return;
    m.t += dt;
    if (m.state === 'pouring' && m.t >= POUR_TIME) setMold(m, 'batter');
    else if (m.state === 'side1' && m.t >= cook) setMold(m, 'flip');
    else if (m.state === 'side2' && m.t >= cook) setMold(m, 'done');
    else if ((m.state === 'flip' || m.state === 'done') && m.t >= burn) {
      setMold(m, 'burnt');
      stats.burnt++;
      play('burn', 0.6);
      if (mode === 'story' || cfg.queue) Story.onBurnt();   // 줄 서기를 쓰면 콤보·만족도는 story.js가 맡는다
      else { chCombo = 0; chChange(SAT.burn); }
    }
  });

  if (cfg.queue) {
    Story.updateQueue(dt);                       // 스토리 모드: 줄 선 손님들
  } else if (customer && !customer.ready) {
    // 그림을 받는 중: 아직 등장하지 않았으니 기다리는 시간도 흐르지 않는다
  } else if (customer) {
    customer.t += dt;
    if (customer.phase === 'in' && customer.t >= 0.45) { customer.phase = 'wait'; customer.t = 0; }
    else if (customer.phase === 'wait') {
      customer.wait -= dt;
      if (customer.restoreAt && elapsed >= customer.restoreAt) { customer.restoreAt = 0; setBubble(customer.lineHtml); }
      if (customer.wait <= 0) {
        stats.missed++;
        play('sad', 0.7);
        if (mode === 'story') Story.onMissed();
        else { chCombo = 0; chChange(SAT.leave); }
        setBubble('<span style="color:#7a6a5a">너무 오래 기다려서 그냥 갈게요...</span>');
        customerLeaves(false);
      }
    } else if (customer.phase === 'out' && customer.t >= 1.3) {
      customer = null;
    }
  } else if (!customer && elapsed < cfg.dayLength - 2) {   // 마감 2초 전부터는 새 손님이 오지 않는다
    nextCustomerIn -= dt;
    if (nextCustomerIn <= 0) spawnCustomer();
  }

  if (cfg.stages && running) {
    const st = chStageIndex(progress());
    if (st !== chStageNow) { chStageNow = st; stageBanner(CH_STAGES[st].msg); setBgmRate(CH_STAGES[st].bgm); }
  }
  if (running && (elapsed >= cfg.dayLength || chOut)) endDay();
}

// 3분 챌린지 단계가 바뀔 때 크게 알린다
function stageBanner(text) {
  const el = $('stage-banner');
  el.textContent = text;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  play('bell', 0.6);
  setTimeout(() => play('bell', 0.6), 180);
}
// 단계가 오를수록 장사 음악을 조금씩 빠르게 (음 높이는 그대로)
function setBgmRate(rate) {
  for (const k in bgm) { try { bgm[k].preservesPitch = true; bgm[k].playbackRate = rate; } catch { /* 무시 */ } }
}

function render() {
  const p = progress();

  // 시계와 하늘
  const left = Math.max(0, Math.ceil(cfg.dayLength - elapsed));
  $('timer-text').textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  $('timer-text').style.color = left <= 20 && running ? '#ffb4a2' : '#fff';
  $('clock-icon').style.backgroundPositionX = `${-18 * Math.min(7, Math.floor(p * 8))}px`;
  const sunset = Math.min(1, Math.max(0, (p - 0.35) / 0.12));
  const night = Math.min(1, Math.max(0, (p - 0.72) / 0.12));
  $('sky-sunset').style.opacity = sunset;
  $('sky-night').style.opacity = night;

  $('money-text').textContent = money.toLocaleString();
  $('sold-text').textContent = stats.sold;
  if (hudMode === 'story') Story.renderHud();
  else drawSat(chSat);

  // 철판
  const cook = cfg.cook(p), burn = cfg.burn(p);
  molds.forEach((m) => {
    m.el.classList.toggle('locked', !!m.locked);
    const src = SPRITE + (m.state === 'pouring' && !m.locked
      ? POUR_FRAMES[Math.min(POUR_FRAMES.length - 1, Math.floor(m.t / (POUR_TIME / POUR_FRAMES.length)))]
      : BREAD_IMG[m.locked ? 'empty' : m.state]);
    if (m.shown !== src) { m.img.src = src; m.shown = src; }
    // 아래 스타일은 값이 바뀔 때만 넣는다 (같은 값을 매 프레임 다시 넣어도 iPhone은 다시 그리는 일이 생긴다)
    const f = (elapsed - m.flipAt) / 0.22;
    setStyle(m.img, 'transform', f >= 0 && f < 1 ? `scaleY(${Math.abs(Math.cos(f * Math.PI)).toFixed(2)})` : '');
    let bar = -1, color = '#ffb347', tag = '';
    if (m.state === 'side1' || m.state === 'side2') bar = m.t / cook;
    if (m.state === 'flip') { bar = 1 - m.t / burn; color = '#ff7043'; tag = '뒤집어요!'; }
    if (m.state === 'done') { bar = 1 - m.t / burn; color = '#e53935'; tag = '다 익었어요!'; }
    setStyle(m.bar, 'display', bar < 0 ? 'none' : '');
    if (bar >= 0) {
      // 너비 대신 scaleX로 줄인다 (레이아웃을 다시 계산하지 않아 가볍다)
      setStyle(m.fill, 'transform', `scaleX(${Math.max(0, Math.min(1, bar)).toFixed(3)})`);
      setStyle(m.fill, 'background', color);
    }
    setStyle(m.tag, 'display', tag ? '' : 'none');
    if (tag && m.tag.textContent !== tag) m.tag.textContent = tag;
    // 뒤집으면 겉모습이 같으니 틀 위에 무엇이 들었는지 표시한다 (슈크림이 있는 날만)
    const flipped = ['side1', 'flip', 'side2', 'done', 'burnt'].includes(m.state);
    const kindText = cfg.cream && flipped ? (m.kind === 'cream' ? '슈' : '팥') : '';
    if (m.kindEl.textContent !== kindText) { m.kindEl.textContent = kindText; m.kindEl.className = 'kind ' + (m.kind || ''); }
    // 다 익은 붕어빵 반짝임: 매 프레임 밝기 필터를 바꾸던 것을 CSS 애니메이션(.ready)으로 (그래픽 칩이 처리)
    if (m.el.classList.contains('ready') !== (m.state === 'done')) m.el.classList.toggle('ready', m.state === 'done');
  });

  // 봉투
  const drawBag = (imgId, countId, prefix, n, ready) => {
    const src = `${SPRITE}${prefix}${Math.min(3, n)}.webp`;
    const img = $(imgId);
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    const text = `${n}<small>/${cfg.bagMax}</small>`;
    const bc = $(countId);
    if (bc.innerHTML !== text) bc.innerHTML = text;
    bc.classList.toggle('full', n >= cfg.bagMax);
    img.style.transform = ready ? `translateY(${-3 * Math.abs(Math.sin(elapsed * 6))}px)` : '';
  };
  if (cfg.queue) {
    const need = Story.frontNeeds();             // 맨 앞 손님이 아직 받아야 할 개수 {bean, cream}
    drawBag('bag-img', 'bag-count', 'bag', bagCount, need.bean > 0 && bagCount > 0);
    drawBag('bag-cream-img', 'bag-cream-count', 'bag-cream', creamPerfect.length, need.cream > 0 && creamPerfect.length > 0);
  } else {
    const w = customer && customer.phase === 'wait' ? customer.left : { bean: 0, cream: 0 };
    drawBag('bag-img', 'bag-count', 'bag', bagCount, w.bean > 0 && bagCount > 0);
    if (cfg.cream) drawBag('bag-cream-img', 'bag-cream-count', 'bag-cream', creamPerfect.length, w.cream > 0 && creamPerfect.length > 0);
  }

  // 손님
  const cImg = $('customer-img'), bubble = $('bubble');
  if (cfg.queue) {
    Story.renderQueue();
  } else if (!customer || !customer.ready) {
    cImg.style.visibility = 'hidden';
    bubble.style.visibility = 'hidden';
  } else {
    cImg.style.visibility = 'visible';
    bubble.style.visibility = 'visible';
    let x = 0, s = 1, bs = 1;
    if (customer.phase === 'in') {
      const k = 1 - Math.pow(1 - Math.min(1, customer.t / 0.45), 3);
      x = -190 * (1 - k); bs = k;
    } else if (customer.phase === 'out') {
      const k = Math.max(0, (customer.t - 0.8) / 0.5);
      x = -200 * k * k; bs = 1 - Math.min(1, k * 2);
      if (customer.mood !== 'sad' && customer.t < 0.8) s = 1 + 0.06 * Math.sin(customer.t * 12);
    }
    // (손님이 좌우로 떨리는 연출은 뺐다: 떨림이 끝나는 시각이 다음 장사까지 남아서 새 손님이 계속 떨리는 일이 있었다)
    cImg.style.transform = `translateX(${x}px) scale(${s})`;
    bubble.style.transform = `scale(${bs})`;
    const r = customer.phase === 'wait' ? customer.wait / customer.max : customer.phase === 'in' ? 1 : 0;
    if (customer.order) { const ct = countText(customer.order, customer.left); if ($('order-chip').textContent !== ct) $('order-chip').textContent = ct; }
    const fill = $('patience-fill');
    fill.style.width = `${Math.max(0, r) * 100}%`;
    fill.style.background = r > 0.6 ? '#5dbb63' : r > 0.3 ? '#f5a623' : '#e74c3c';
  }

  // 알림
  const tEl = $('toast');
  const tl = toastUntil - elapsed;
  tEl.style.opacity = tl > 0 ? Math.min(1, tl / 0.25) : 0;
  tEl.style.transform = `translate(-50%, ${tl > 0 ? -6 * (1 - Math.min(1, tl / 1.4)) : 0}px)`;

}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (running && !paused && !document.hidden) update(dt);
  render();
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    for (const k in bgm) bgm[k].pause();
    pauseGame();   // 다른 앱으로 나갔다 오면 일시정지 화면에서 이어 하게 한다
  }
  else {
    if (actx && actx.state !== 'running') actx.resume().catch(() => {});   // iOS는 돌아오면 멈춰 있다
    if (currentBgm && !$('loading').classList.contains('hidden')) return;
    if (currentBgm) playBgm(currentBgm);
  }
});

// ───────────────────────── 처음 불러오기 ─────────────────────────
// 그림 전부, 효과음 전부, 타이틀 음악, 첫날 장사 음악을 받는 동안 로딩 화면을 보여 준다.
// 다 받으면 "화면을 터치하면 시작해요": 이 터치가 iPhone에서 소리를 켜는 첫 터치가 된다.
const PRELOAD_SPRITES = [
  'start-scene', 'bg-morning', 'bg-sunset', 'bg-night', 'curtain', 'textbox', 'button',
  'timer-pill', 'money-pill', 'bread-pill', 'clock',
  'mold', 'pour1', 'pour2', 'pour3', 'pour4', 'batter', 'batter-bean', 'fresh', 'soso', 'good', 'burnt',
  'bag0', 'bag1', 'bag2', 'bag3', 'kettle', 'kettle-on', 'bean', 'bean-on', 'stick', 'stick-on',
  'batter-cream', 'cream', 'cream-on', 'bag-cream0', 'bag-cream1', 'bag-cream2', 'bag-cream3',
];
function loadImage(im) {
  return new Promise((done) => {
    if (im.complete) return done();
    im.addEventListener('load', done, { once: true });
    im.addEventListener('error', done, { once: true });
  });
}
let loadingDone = false;
function startLoading() {
  const images = PRELOAD_SPRITES.map((name) => loadImage(Object.assign(new Image(), { src: SPRITE + name + '.webp' })));
  const tasks = [
    ...images,
    ...Object.values(customerImgCache).map(loadImage),
    ...sfxReady,
    loadBgm('title'),
    loadBgm(nextGameTrack),
    // 게임 전용 폰트 두 굵기 (받기 전에 화면이 기본 폰트로 그려졌다 바뀌지 않게)
    ...(document.fonts ? [400, 700].map((w) => document.fonts.load(`${w} 16px Dongle`, '붕어빵')) : []),
  ];
  let done = 0;
  const step = () => {
    done++;
    const pct = Math.round((done / tasks.length) * 100);
    $('loading-fill').style.width = pct + '%';
    $('loading-text').textContent = `게임 데이터를 불러오는 중입니다... ${pct}%`;
  };
  tasks.forEach((t) => t.then(step, step));
  // 네트워크가 아주 느려도 15초가 지나면 그냥 시작할 수 있게 한다 (못 받은 건 쓸 때 받는다)
  const timeout = new Promise((ok) => setTimeout(ok, 15000));
  Promise.race([Promise.all(tasks.map((t) => t.catch(() => {}))), timeout]).then(() => {
    loadingDone = true;
    Online.preload();   // 전체 랭킹은 로딩이 끝난 뒤 뒤에서 받아 둔다
    $('loading').classList.add('ready');
    $('loading-text').textContent = '화면을 터치하면 시작해요';
    GAME_TRACKS.forEach(loadBgm);   // 나머지 장사 음악은 뒤에서 받아 둔다
    // 게임 방법·업데이트 기록의 긴 글 폰트도 뒤에서 받아 둔다 (열기 전에 받아져 있게)
    if (document.fonts) document.fonts.load('400 13px "IBM Plex Sans KR"', '붕어빵').catch(() => {});
  });
}
$('loading').addEventListener('click', () => {
  if (!loadingDone) return;
  unlockAudio();
  $('loading').classList.add('hidden');
  showTitle();   // 이 터치 안에서 타이틀 음악을 튼다
});

setSound(soundOn);
startLoading();
requestAnimationFrame(frame);
