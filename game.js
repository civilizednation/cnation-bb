'use strict';

// ───────────────────────── 설정 ─────────────────────────
const DAY_LENGTH = 180;        // 하루 장사 시간(초)
const PRICE = 1000;            // 붕어빵 한 개 값
const BATTER_COST = 300;       // 반죽 한 번 붓는 재료비
const BAG_MAX = 9;
const SPRITE = 'assets/sprites/';
const SOUND = 'assets/sounds/';

// 시간이 갈수록 빨리 익고(바빠지고) 손님은 덜 기다린다
function cookTime(progress) { return 5 - 1.6 * progress; }   // 한 면 익는 시간
function burnTime(progress) { return 6 - 1.5 * progress; }   // 다 익은 뒤 타기까지
function patienceTime(progress) { return 32 - 10 * progress; }

const BREAD_IMG = {
  empty: 'mold.webp',
  batter: 'batter.webp',
  bean: 'batter-bean.webp',
  side1: 'fresh.webp',
  flip: 'soso.webp',
  side2: 'soso.webp',
  done: 'good.webp',
  burnt: 'burnt.webp',
};

const CUSTOMERS = [
  { id: 'alpaca', line: '붕어빵 {n} 주세요~ 오늘 너무 춥네요.' },
  { id: 'auntie', line: '사장님, 붕어빵 {n} 줘요~ 애들 간식!' },
  { id: 'deer', line: '붕어빵 {n} 바구니에 담아 주세요!' },
  { id: 'hedgehog', line: '저기... 붕어빵 {n} 주실래요?' },
  { id: 'otter', line: '따끈한 붕어빵 {n} 주세요!' },
  { id: 'owl', line: '배달 가는 길이에요. 붕어빵 {n}!' },
  { id: 'penguin', line: '붕어빵 {n} 포장해 주세요! 뒤뚱뒤뚱~' },
  { id: 'rabbit', line: '와, 냄새 좋다! 붕어빵 {n} 주세요!' },
  { id: 'seal', line: '팥 듬뿍 든 붕어빵 {n} 주세요!' },
  { id: 'squirrel', line: '도토리 대신 붕어빵! {n} 주세요~' },
];
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
if (actx) {
  SFX_NAMES.forEach((name) => {
    fetch(SOUND + name + '.mp3')
      .then((r) => r.arrayBuffer())
      .then((data) => new Promise((ok, fail) => actx.decodeAudioData(data, ok, fail)))
      .then((buf) => { sfxBuffers[name] = buf; })
      .catch(() => {});
  });
} else {
  SFX_NAMES.forEach((name) => sfxElement(name));
}
function sfxElement(name) {
  if (!sfxEls[name]) {
    sfxEls[name] = new Audio(SOUND + name + '.mp3');
    sfxEls[name].preload = 'auto';
  }
  return sfxEls[name];
}

// 배경음악은 가벼운 webm(Opus)을 쓰고, 재생하지 못하는 브라우저(구형 iOS Safari 등)만 mp3를 받는다
const BGM_EXT = new Audio().canPlayType('audio/webm; codecs="opus"') ? '.webm' : '.mp3';
function makeBgm(name, volume, preload = 'auto') {
  const el = new Audio();
  el.loop = true;
  el.preload = preload;
  el.src = SOUND + name + BGM_EXT;
  if (actx) {
    const src = actx.createMediaElementSource(el);
    const gain = actx.createGain();
    gain.gain.value = volume;
    src.connect(gain);
    gain.connect(actx.destination);
  } else {
    el.volume = volume;
  }
  el.addEventListener('playing', () => { if (!actx || actx.state === 'running') markUnlocked(); });
  return el;
}
// 장사 음악은 3곡 중 하나를 날마다 무작위로 고른다 (전날과 같은 곡은 피한다).
// 처음엔 그날 틀 곡만 받아 두고, 나머지는 정산 화면에서 다음 날 곡을 미리 받는다.
const GAME_TRACKS = ['game1', 'game2', 'game3'];
const bgm = { title: makeBgm('bgm-title', 0.4) };
GAME_TRACKS.forEach((k) => { bgm[k] = makeBgm('bgm-' + k, 0.4, 'none'); });
let nextGameTrack = pickGameTrack(null);
preloadBgm(nextGameTrack);

function pickGameTrack(prev) {
  const pool = GAME_TRACKS.filter((k) => k !== prev);
  return pool[Math.floor(Math.random() * pool.length)];
}
function preloadBgm(k) {
  const el = bgm[k];
  if (el.preload === 'auto') return;
  el.preload = 'auto';
  el.load();
}
let soundOn = localStorage.getItem('bb-sound') !== 'off';
let currentBgm = null;
let audioUnlocked = false;

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
  if (restart && changed) bgm[which].currentTime = 0;
  if (soundOn) bgm[which].play().catch(() => {});
}
function setSound(on) {
  soundOn = on;
  localStorage.setItem('bb-sound', on ? 'on' : 'off');
  document.getElementById('sound-btn').textContent = on ? '🔊' : '🔇';
  if (on) playBgm(currentBgm); else for (const k in bgm) bgm[k].pause();
  updateTapHint();
}

// 모바일은 첫 터치 전에는 소리를 낼 수 없다: 어디든 처음 누르면 소리를 깨운다
function unlockAudio() {
  if (actx && actx.state !== 'running') actx.resume().then(markUnlocked).catch(() => {});
  else markUnlocked();
}
function markUnlocked() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  updateTapHint();
}
function updateTapHint() {
  const el = document.getElementById('tap-hint');
  if (el) el.classList.toggle('hidden', audioUnlocked || !soundOn);
}
document.addEventListener('pointerdown', unlockAudio, true);

// ───────────────────────── 화면 요소 ─────────────────────────
const $ = (id) => document.getElementById(id);
const grillEl = $('grill');
const molds = [];
for (let i = 0; i < 9; i++) {
  const el = document.createElement('div');
  el.className = 'mold';
  el.innerHTML = `<img src="${SPRITE}mold.webp" alt=""><div class="bar"><i></i></div><span class="tag"></span>`;
  grillEl.appendChild(el);
  molds.push({
    el,
    img: el.querySelector('img'),
    bar: el.querySelector('.bar'),
    fill: el.querySelector('.bar i'),
    tag: el.querySelector('.tag'),
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
$('bag').addEventListener('pointerdown', (e) => { e.preventDefault(); onBag(); });
$('sound-btn').addEventListener('click', () => setSound(!soundOn));
$('start-btn').addEventListener('click', () => startDay());
$('again-btn').addEventListener('click', () => startDay());
$('help-btn').addEventListener('click', () => $('help').classList.remove('hidden'));
$('help-close').addEventListener('click', () => $('help').classList.add('hidden'));
$('home-btn').addEventListener('click', () => showTitle());
// 시작 화면을 처음 누르면 시작 화면 음악을 튼다 (시작 버튼은 바로 장사 음악으로 넘어가니 건너뛴다)
$('title').addEventListener('pointerdown', (e) => {
  if (!e.target.closest('#start-btn') && bgm.title.paused) playBgm('title');
});

// ───────────────────────── 게임 상태 ─────────────────────────
let running = false;
let elapsed = 0;
let tool = 'batter';
let bagCount = 0;
let money = 0;
const stats = { sold: 0, sales: 0, tips: 0, cost: 0, burnt: 0, missed: 0 };
let customer = null;           // { def, need, wait, max, phase, t }
let nextCustomerIn = 0;
let toastUntil = 0;
let shakeUntil = 0;

function progress() { return Math.min(1, elapsed / DAY_LENGTH); }

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

function setMold(m, state) {
  m.state = state;
  m.t = 0;
}

function onMold(i) {
  if (!running) return;
  const m = molds[i];
  if (elapsed - m.flipAt < 0.22) return;          // 뒤집는 중
  switch (m.state) {
    case 'empty':
      if (tool !== 'batter') return hint(tool === 'stick' ? '빈 틀이에요. 반죽부터 부어요' : '반죽부터 부어요');
      play('pour');
      stats.cost += BATTER_COST;
      money -= BATTER_COST;
      setMold(m, 'batter');
      break;
    case 'batter':
      if (tool !== 'bean') return hint('팥을 올려요');
      play('bean');
      setMold(m, 'bean');
      break;
    case 'bean':
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
      if (bagCount >= BAG_MAX) return hint('봉투가 꽉 찼어요');
      play('collect');
      bagCount++;
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

function spawnCustomer() {
  const def = pickCustomer();
  const p = progress();
  const maxNeed = p < 0.3 ? 2 : 3;
  const need = 1 + Math.floor(Math.random() * maxNeed);
  const max = patienceTime(p);
  customer = { def, need, wait: max, max, phase: 'in', t: 0, mood: 'normal' };
  $('customer-img').src = SPRITE + def.id + '.webp';
  $('bubble-text').innerHTML = def.line.replace('{n}', `<span class="n">${need}개</span>`);
  play('bell', 0.5);
}

function customerLeaves(happy) {
  customer.phase = 'out';
  customer.t = 0;
  if (!happy) {
    customer.mood = 'sad';
    if (!customer.def.noSad) $('customer-img').src = SPRITE + customer.def.id + '-sad.webp';
  }
  nextCustomerIn = 1.6 + Math.random() * 1.2;
}

function onBag() {
  if (!running) return;
  play('bag');
  if (!customer || customer.phase !== 'wait') return hint('손님이 아직 없어요');
  if (bagCount < customer.need) {
    play('sad', 0.7);
    shakeUntil = elapsed + 0.45;
    customer.wait = Math.max(0, customer.wait - 2);
    $('bubble-text').innerHTML = `<span style="color:#c0392b">모자라요! <span class="n">${customer.need}개</span> 시켰어요!</span>`;
    return;
  }
  bagCount -= customer.need;
  const tip = customer.wait / customer.max > 0.6 ? 200 * customer.need : 0;
  const earned = customer.need * PRICE + tip;
  money += earned;
  stats.sold += customer.need;
  stats.sales += customer.need * PRICE;
  stats.tips += tip;
  play('happy');
  $('bubble-text').innerHTML = `<b>${THANKS[Math.floor(Math.random() * THANKS.length)]}</b>`;
  toast(tip ? `+${earned.toLocaleString()}원 (팁 ${tip}원)` : `+${earned.toLocaleString()}원`);
  customerLeaves(true);
}

// ───────────────────────── 하루 흐름 ─────────────────────────
function startDay() {
  ['title', 'result', 'help'].forEach((id) => $(id).classList.add('hidden'));
  running = true;
  elapsed = 0;
  bagCount = 0;
  money = 0;
  Object.keys(stats).forEach((k) => { stats[k] = 0; });
  molds.forEach((m) => { setMold(m, 'empty'); m.flipAt = -1; });
  customer = null;
  nextCustomerIn = 1.2;
  toastUntil = 0;
  selectTool('batter');
  play('start');
  playBgm(nextGameTrack, true);
}

function endDay() {
  running = false;
  play('start');
  playBgm(null);
  // 마감 소리가 끝나면 정산 화면에 시작 화면 음악을 처음부터 깔아 준다
  setTimeout(() => { if (!running && currentBgm === null) playBgm('title', true); }, 1200);
  nextGameTrack = pickGameTrack(nextGameTrack);   // 다음 날 곡을 정산하는 동안 미리 받아 둔다
  preloadBgm(nextGameTrack);
  const net = money;
  const best = Math.max(net, Number(localStorage.getItem('bb-best') || 0));
  const isNew = net > 0 && net >= best && net > Number(localStorage.getItem('bb-best') || 0);
  localStorage.setItem('bb-best', String(best));
  $('r-sold').textContent = `${stats.sold}개`;
  $('r-sales').textContent = `+${stats.sales.toLocaleString()}원`;
  $('r-tips').textContent = `+${stats.tips.toLocaleString()}원`;
  $('r-cost').textContent = `-${stats.cost.toLocaleString()}원`;
  $('r-miss').textContent = `${stats.burnt}개 · ${stats.missed}명`;
  $('r-total').textContent = `${net.toLocaleString()}원`;
  $('r-best').textContent = isNew ? '🎉 최고 기록이에요!' : `최고 기록 ${best.toLocaleString()}원`;
  $('result').classList.remove('hidden');
}

function showTitle() {
  ['result', 'help'].forEach((id) => $(id).classList.add('hidden'));
  $('title').classList.remove('hidden');
  const best = Number(localStorage.getItem('bb-best') || 0);
  $('best-text').textContent = best > 0 ? `최고 기록 ${best.toLocaleString()}원` : '';
  playBgm('title');
}

// ───────────────────────── 매 프레임 ─────────────────────────
function update(dt) {
  elapsed += dt;
  const p = progress();
  const cook = cookTime(p), burn = burnTime(p);

  molds.forEach((m) => {
    m.t += dt;
    if (m.state === 'side1' && m.t >= cook) setMold(m, 'flip');
    else if (m.state === 'side2' && m.t >= cook) setMold(m, 'done');
    else if ((m.state === 'flip' || m.state === 'done') && m.t >= burn) {
      setMold(m, 'burnt');
      stats.burnt++;
      play('burn', 0.6);
    }
  });

  if (customer) {
    customer.t += dt;
    if (customer.phase === 'in' && customer.t >= 0.45) { customer.phase = 'wait'; customer.t = 0; }
    else if (customer.phase === 'wait') {
      customer.wait -= dt;
      if (customer.wait <= 0) {
        stats.missed++;
        play('sad', 0.7);
        $('bubble-text').innerHTML = '<span style="color:#7a6a5a">너무 오래 기다려서 그냥 갈게요...</span>';
        customerLeaves(false);
      }
    } else if (customer.phase === 'out' && customer.t >= 1.3) {
      customer = null;
    }
  } else if (elapsed < DAY_LENGTH - 4) {
    nextCustomerIn -= dt;
    if (nextCustomerIn <= 0) spawnCustomer();
  }

  if (elapsed >= DAY_LENGTH) endDay();
}

function render() {
  const p = progress();

  // 시계와 하늘
  const left = Math.max(0, Math.ceil(DAY_LENGTH - elapsed));
  $('timer-text').textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  $('timer-text').style.color = left <= 20 && running ? '#ffb4a2' : '#fff';
  $('clock-icon').style.backgroundPositionX = `${-18 * Math.min(7, Math.floor(p * 8))}px`;
  const sunset = Math.min(1, Math.max(0, (p - 0.35) / 0.12));
  const night = Math.min(1, Math.max(0, (p - 0.72) / 0.12));
  $('sky-sunset').style.opacity = sunset;
  $('sky-night').style.opacity = night;

  $('money-text').textContent = money.toLocaleString();
  $('sold-text').textContent = stats.sold;

  // 철판
  const cook = cookTime(p), burn = burnTime(p);
  molds.forEach((m) => {
    const src = SPRITE + BREAD_IMG[m.state];
    if (m.shown !== src) { m.img.src = src; m.shown = src; }
    const f = (elapsed - m.flipAt) / 0.22;
    m.img.style.transform = f >= 0 && f < 1 ? `scaleY(${Math.abs(Math.cos(f * Math.PI))})` : '';
    let bar = -1, color = '#ffb347', tag = '';
    if (m.state === 'side1' || m.state === 'side2') bar = m.t / cook;
    if (m.state === 'flip') { bar = 1 - m.t / burn; color = '#ff7043'; tag = '뒤집어요!'; }
    if (m.state === 'done') { bar = 1 - m.t / burn; color = '#e53935'; tag = '다 익었어요!'; }
    m.bar.style.display = bar < 0 ? 'none' : '';
    if (bar >= 0) { m.fill.style.width = `${Math.max(0, Math.min(1, bar)) * 100}%`; m.fill.style.background = color; }
    m.tag.style.display = tag ? '' : 'none';
    if (tag && m.tag.textContent !== tag) m.tag.textContent = tag;
    if (m.state === 'done') m.img.style.filter = `brightness(${1 + 0.08 * Math.sin(elapsed * 8)})`;
    else if (m.img.style.filter) m.img.style.filter = '';
  });

  // 봉투
  const bagSrc = `${SPRITE}bag${Math.min(3, bagCount)}.webp`;
  const bagImg = $('bag-img');
  if (bagImg.getAttribute('src') !== bagSrc) bagImg.setAttribute('src', bagSrc);
  $('bag-count').textContent = bagCount;
  const ready = customer && customer.phase === 'wait' && bagCount >= customer.need;
  bagImg.style.transform = ready ? `translateY(${-3 * Math.abs(Math.sin(elapsed * 6))}px)` : '';

  // 손님
  const cImg = $('customer-img'), bubble = $('bubble');
  if (!customer) {
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
    const shake = elapsed < shakeUntil ? 6 * Math.sin(elapsed * 60) : 0;
    cImg.style.transform = `translateX(${x + shake}px) scale(${s})`;
    bubble.style.transform = `scale(${bs})`;
    const r = customer.phase === 'wait' ? customer.wait / customer.max : customer.phase === 'in' ? 1 : 0;
    const fill = $('patience-fill');
    fill.style.width = `${Math.max(0, r) * 100}%`;
    fill.style.background = r > 0.6 ? '#5dbb63' : r > 0.3 ? '#f5a623' : '#e74c3c';
  }

  // 알림
  const tEl = $('toast');
  const tl = toastUntil - elapsed;
  tEl.style.opacity = tl > 0 ? Math.min(1, tl / 0.25) : 0;
  tEl.style.transform = `translate(-50%, ${tl > 0 ? -6 * (1 - Math.min(1, tl / 1.4)) : 0}px)`;

  renderGuide();
}

// 첫 판매 전까지 다음에 누를 곳을 화살표로 알려 준다
function guideTarget() {
  if (!running || stats.sold > 0) return null;
  if (customer && customer.phase === 'wait' && bagCount >= customer.need) return $('bag');
  const order = ['done', 'flip', 'bean', 'batter'];
  for (const st of order) {
    const m = molds.find((x) => x.state === st);
    if (!m) continue;
    const need = st === 'batter' ? 'bean' : 'stick';
    return tool === need ? m.el : tools.find((b) => b.dataset.tool === need);
  }
  if (molds.some((m) => m.state === 'side1' || m.state === 'side2')) return null;
  const empty = molds.find((m) => m.state === 'empty');
  if (!empty) return null;
  return tool === 'batter' ? empty.el : tools.find((b) => b.dataset.tool === 'batter');
}
function renderGuide() {
  const g = $('guide');
  const target = guideTarget();
  if (!target) { g.style.display = 'none'; return; }
  const sr = stage.getBoundingClientRect(), tr = target.getBoundingClientRect();
  const s = sr.width / 360;
  const cx = (tr.left + tr.width / 2 - sr.left) / s;
  const top = (tr.top - sr.top) / s;
  g.style.display = 'block';
  g.style.left = `${cx - 23}px`;
  g.style.top = `${top - 40 + 5 * Math.sin(elapsed * 6)}px`;
  g.style.transform = 'rotate(90deg)';
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (running && !document.hidden) update(dt);
  render();
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { for (const k in bgm) bgm[k].pause(); }
  else {
    if (actx && actx.state !== 'running') actx.resume().catch(() => {});   // iOS는 돌아오면 멈춰 있다
    if (currentBgm) playBgm(currentBgm);
  }
});

setSound(soundOn);
showTitle();
requestAnimationFrame(frame);
