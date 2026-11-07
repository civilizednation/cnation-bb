'use strict';

// ───────────────────────── 한국어 / English ─────────────────────────
// 타이틀 화면의 언어 버튼으로 고른다(기기에 저장, 바꾸면 새로 불러옴).
// 영어일 때는 화면에 넣는 글(textContent·innerHTML)을 넣는 순간 영어로 바꾼다:
//   1) 아래 EN 사전에서 그대로 찾고  2) 숫자가 들어간 문장은 RULES로  3) " · ", " → ", 줄바꿈으로 나눠서 다시 찾는다.
// 게임 코드에 새 한국어 문장을 넣으면 EN 사전(또는 RULES)에 영어도 같이 넣는다. (CLAUDE.md 참고)
// 손님 대사는 EN_LINES·EN_SPECIALS를 game.js·story.js가 직접 쓴다.
const LANG = (() => { try { return localStorage.getItem('cnation-bb-lang') === 'en' ? 'en' : 'ko'; } catch { return 'ko'; } })();

const I18N = (() => {
  const HANGUL = /[가-힣]/;
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const EN = {
"cnation 붕어빵 타이쿤": "cnation Fish Bread Tycoon",
"손님 만족도": "Satisfaction",
"일시정지": "Pause",
"소리 켜기/끄기": "Sound on/off",
"손님": "Customer",
"팥": "Bean",
"봉투를 손님에게 건네기": "Hand bag to customer",
"슈크림": "Custard",
"슈크림 봉투를 손님에게 건네기": "Hand custard bag to customer",
"반죽": "Batter",
"꼬챙이": "Skewer",
"붕어빵 타이쿤": "Fish Bread Tycoon",
"화면을 터치하면 시작해요": "Tap the screen to start",
"스토리 모드": "Story Mode",
"3분 챌린지": "3-Minute Challenge",
"게임 방법": "How to Play",
"랭킹": "Ranking",
"붕어빵 굽는 법": "How to bake",
"<b>반죽</b>을 들고 빈 틀을 눌러 반죽을 부어요.": "Hold the <b>batter</b> and tap an empty mold to pour it.",
"<b>팥</b>을 들고 반죽 위를 눌러 팥을 올려요.": "Hold the <b>red bean</b> and tap the batter to add the filling.",
"<b>꼬챙이</b>로 눌러 뒤집어요. 한쪽이 익으면 <b>한 번 더</b> 뒤집어요.": "Tap with the <b>skewer</b> to flip it. When one side is done, flip it <b>once more</b>.",
"노릇해지면 꼬챙이로 눌러 <b>봉투</b>에 담아요. 너무 오래 두면 타요!": "When it turns golden, tap it with the skewer to put it in the <b>bag</b>. Leave it too long and it burns!",
"주문한 개수만큼 담기면 <b>봉투</b>를 눌러 건네요.": "Once the bag has enough for the order, tap the <b>bag</b> to hand it over.",
"겨울 보름(<b>Day 1~15</b>) 동안 붕어빵 가게를 꾸려요. 하루 장사는 45~80초이고, 날이 갈수록 손님이 많아지고 주문도 커져요.": "Run a fish bread stand for half a winter month (<b>Day 1–15</b>). Each day lasts about a minute or two, and every day brings more customers and bigger orders.",
"화면 위의 <b>😊 만족도</b>는 70%에서 시작해요. 빨리 건네면 오르고(5명 연속이면 보너스), 오래 기다리게 하면 오르지 않거나 내려가요. 손님이 떠나면 -12(특별 손님은 -15), 붕어빵을 태우면 -3, 안 시킨 종류를 건네면 -4예요. <b>80%</b>가 넘으면 오르는 양이 절반이 돼요.": "<b>😊 Satisfaction</b> at the top starts at 70%. Serve fast to raise it (bonus for 5 in a row); make customers wait and it won't rise or will drop. A customer leaving costs -12 (-15 for special guests), a burnt bread -3, the wrong kind -4. Above <b>80%</b>, gains are halved.",
"\"다 익었어요!\"가 뜨자마자 꺼낸 <b>완벽한 붕어빵</b>만 건네면 만족도가 조금 더 올라요.": "Serve only <b>perfect fish bread</b>, picked up right when \"Done!\" appears, for a little extra satisfaction.",
"틀은 처음에 4개, <b>Day 2</b>에 6개, <b>Day 4</b>에 9개로 늘어나요.": "You start with 4 molds, 6 on <b>Day 2</b> and 9 on <b>Day 4</b>.",
"손님은 <b>줄을 서요.</b> Day 1은 한 명씩, <b>Day 2</b>부터 최대 2명, <b>Day 4</b>부터 최대 3명, <b>Day 9</b>부터 최대 4명까지 서요. 항상 맨 앞 손님에게 건네고, 뒤에 선 손님일수록 천천히 지쳐요. 뒤 손님 머리 위 주문표로 무엇을 미리 구울지 정해요.": "Customers <b>line up.</b> One at a time on Day 1, up to 2 from <b>Day 2</b>, up to 3 from <b>Day 4</b> and up to 4 from <b>Day 9</b>. Always serve the one at the front; those further back lose patience more slowly. Use the order tags above their heads to plan what to bake.",
"봉투를 <b>한 번 누를 때마다 한 개</b>씩 건네요. 말풍선 아래에 남은 개수가 보여요. 다 받은 손님이 떠나기 전에 더 누르면 <b>덤</b>으로 나가요(돈은 못 받아요).": "Each tap of the bag hands over <b>one fish bread</b>. The remaining count is shown under the speech bubble. Tapping more before a served customer leaves gives a <b>free extra</b> (no money).",
"<b>Day 4</b>부터 <b>슈크림</b> 메뉴가 생겨요. 반죽 위에 슈크림을 올려 구우면 슈크림 봉투에 담겨요. 안 시킨 종류를 건네면 손님이 돌려주고 만족도가 조금 내려가요. <b>Day 8</b>부터는 섞어서 시키는 손님도 와요.": "From <b>Day 4</b> there's a <b>custard</b> menu. Put custard on the batter and it goes to the custard bag. Hand over a kind they didn't order and they give it back, with a small satisfaction drop. From <b>Day 8</b> some customers order both.",
"장사가 끝나면 <b>상점</b>에서 번 돈으로 가게를 업그레이드할 수 있어요. 간판과 가격 인상은 더 벌 수 있지만 장사가 어려워지니, 자신 있을 때 사세요.": "After each day you can upgrade the stand in the <b>shop</b>. The sign and price increase earn more but make business harder, so buy them when you're confident.",
"만족도가 <b>0%</b>가 되면 <b>게임 오버</b>예요. 다시 할 수 없고 이번 스토리는 거기서 끝나요. 그때까지 모은 돈으로 랭킹에 올릴 수 있어요.": "If satisfaction hits <b>0%</b> it's <b>game over</b>. There's no retry; the story ends there. You can still post the money you saved to the ranking.",
"동네 사람들이 <b>특별 손님</b>으로 Day 1부터 와요. 종이 두 번 울리고 말풍선 위에 이름표가 붙어요. 사람마다 규칙이 달라요. 맨 아래 <b>손님 소개</b>에서 확인해 보세요!": "Neighbors visit as <b>special guests</b> from Day 1. A double bell rings and a name tag appears on the bubble. Each has their own rules — see <b>Meet the Customers</b> at the bottom!",
"Day 15까지 마치면 만족도에 따라 엔딩이 달라지고, 그때 <b>가진 돈</b>으로 랭킹에 올라가요.": "Finish Day 15 to get an ending based on satisfaction; the <b>money you have</b> then goes to the ranking.",
"하루가 시작될 때 자동으로 저장돼요. 장사 도중에 나가면 다음에 그날 아침부터 다시 해요.": "The game saves automatically at the start of each day. If you leave mid-day, you restart that morning next time.",
"<b>3분 챌린지</b>는 3분 동안 최대한 많이 파는 속도전이에요. <b>팥</b>만 굽거나, <b>팥 &amp; 슈크림</b>을 함께 구울지 골라서 시작해요. 동물 손님만 와요.": "The <b>3-Minute Challenge</b> is a speed run: sell as much as you can in 3 minutes. Choose <b>red bean</b> only or <b>red bean &amp; custard</b>. Only animal customers come.",
"스토리 모드처럼 손님이 <b>줄을 서요.</b> 처음 20초는 한 명씩, 20초부터 <b>최대 2명</b>, 2단계부터 <b>최대 3명</b>, 3단계 밤 러시에는 <b>최대 5명</b>까지 줄을 서요. 봉투는 항상 맨 앞 손님에게 건네고, 뒤에 선 손님일수록 천천히 지쳐요.": "Customers <b>line up</b> like in Story Mode: one at a time for the first 20 seconds, then <b>up to 2</b>, <b>up to 3</b> from stage 2 and <b>up to 5</b> in the stage 3 night rush. Always serve the front customer; those behind lose patience more slowly.",
"<b>1분마다 단계가 올라가요.</b> 단계가 바뀌면 화면에 크게 알려 주고 음악도 빨라져요. <br>· <b>1단계 아침</b> (0~1분): 한 면 5초에 익음, 손님 3~4초마다, 인내심 30초, 1~2개 주문, 팁 한 개 200원 <br>· <b>2단계 저녁</b> (1~2분): 4초, 손님 2~3초마다, 인내심 22초, 1~3개, 팁 300원 <br>· <b>3단계 밤 러시</b> (2~3분): 3.2초, 손님 1.2~1.8초마다, 인내심 15초, 2~4개, 팁 400원. 빨리 타니 조심!": "<b>The stage goes up every minute.</b> A big banner announces it and the music speeds up. <br>· <b>Stage 1 Morning</b> (0–1 min): a side bakes in 5s, a customer every 3–4s, patience 30s, orders of 1–2, tip ₩200 each <br>· <b>Stage 2 Evening</b> (1–2 min): 4s, a customer every 2–3s, patience 22s, 1–3, tip ₩300 <br>· <b>Stage 3 Night Rush</b> (2–3 min): 3.2s, a customer every 1.2–1.8s, patience 15s, 2–4, tip ₩400. Burns fast — careful!",
"<b>😊 손님 만족도</b>도 있어요. 규칙은 스토리 모드와 같고 70%에서 시작해요. 만족도가 <b>0%</b>가 되면 3분 전이라도 장사가 끝나요.": "There's <b>😊 customer satisfaction</b> too, with the same rules as Story Mode, starting at 70%. If it hits <b>0%</b> the run ends early.",
"붕어빵은 한 개에 <b>1,000원</b>(슈크림은 1,200원), 반죽을 한 번 부을 때마다 재료비 <b>300원</b>이 들어요.": "A fish bread sells for <b>₩1,000</b> (custard ₩1,200), and each pour of batter costs <b>₩300</b>.",
"스토리 모드와 같이 봉투를 <b>한 번 누를 때마다 한 개</b>씩 건네요. 말풍선 아래에 남은 개수가 보여요. 팥 &amp; 슈크림에서는 두 가지를 섞어 시키는 손님도 있으니 두 봉투를 모두 건네야 해요.": "Like Story Mode, <b>each tap hands over one</b>. The remaining count is shown under the bubble. In Red Bean &amp; Custard some customers order both, so use both bags.",
"손님 인내심 바가 <b>초록색</b>일 때 다 건네면 단계에 따라 한 개에 <b>200~400원</b>씩 팁을 받아요.": "Finish serving while the patience bar is <b>green</b> to get a tip of <b>₩200–400</b> per bread depending on the stage.",
"손님을 너무 오래 기다리게 하면 그냥 떠나요.": "If you keep a customer waiting too long, they leave.",
"다 익은 붕어빵을 오래 두면 타요. 탄 붕어빵은 꼬챙이로 눌러 치워요.": "Fish bread burns if you leave it too long. Tap burnt ones with the skewer to clear them.",
"봉투에는 붕어빵을 <b>9개</b>까지 담을 수 있어요.": "The bag holds up to <b>9</b> fish breads.",
"장사가 끝나면 매출 · 팁 · 재료비로 순이익을 계산하고, <b>최종 점수 = 순이익 × 만족도 배수</b>로 순위를 매겨요. 배수는 만족도 0%일 때 ×0.5, 50%일 때 ×1.0, 100%일 때 ×1.5예요. 많이 팔아도 실수가 많으면 점수가 낮아요!": "At the end, profit is sales + tips − ingredients, and you're ranked by <b>Final score = Profit × Satisfaction multiplier</b>. The multiplier is ×0.5 at 0%, ×1.0 at 50% and ×1.5 at 100%. Sell a lot with many mistakes and your score stays low!",
"10위 안에 들면 이름을 적어 <b>랭킹</b>에 올릴 수 있어요. (3분 챌린지 랭킹은 v1.5.3부터 점수제로 새로 시작했어요.)": "Make the top 10 and you can enter your name in the <b>ranking</b>. (Challenge rankings restarted with scores in v1.5.3.)",
"랭킹은 <b>스토리 모드 · 3분 팥 · 3분 팥 &amp; 슈크림</b> 세 가지로 따로 관리해요. 처음 화면의 <b>랭킹</b> 버튼에서 탭을 눌러 볼 수 있어요.": "There are three separate rankings: <b>Story · 3-Min Bean · 3-Min Bean &amp; Custard</b>. Open them from the <b>Ranking</b> button on the title screen.",
"랭킹은 <b>🌏 전체</b>(모든 사람의 기록, 인터넷 필요)와 <b>📱 내 기기</b>(이 기기에서 낸 기록)로 나눠 볼 수 있어요. 랭킹에 올리면 두 곳에 함께 남고, 인터넷이 끊겨 있으면 내 기기에만 남아요.": "Rankings can be viewed as <b>🌏 Global</b> (everyone, needs internet) or <b>📱 This device</b>. A posted record goes to both; offline it stays on this device only.",
"알아 두면 좋아요": "Good to know",
"장사 중 <b>⏸ 버튼</b>으로 잠깐 쉴 수 있어요. 3분 챌린지에서는 계속하기 · 처음부터 다시 하기 · 처음 화면으로를, 스토리 모드에서는 계속하기 · 처음 화면으로를 고를 수 있어요.": "Use the <b>⏸ button</b> to take a break. In the challenge you can continue, restart or go to the title; in Story Mode, continue or go to the title.",
"다른 앱으로 나갔다 오면 자동으로 일시정지돼요.": "Switching to another app pauses the game automatically.",
"<b>🔊 버튼</b>으로 소리를 켜고 끌 수 있어요.": "Turn sound on or off with the <b>🔊 button</b>.",
"손님 소개": "Meet the Customers",
"동물 손님 16종 · 3분 챌린지와 스토리 모드에 나와요": "16 animal customers · in the challenge and Story Mode",
"알파카": "Alpaca",
"사슴": "Deer",
"고슴도치": "Hedgehog",
"수달": "Otter",
"부엉이": "Owl",
"펭귄": "Penguin",
"토끼": "Rabbit",
"물범": "Seal",
"다람쥐": "Squirrel",
"고양이": "Cat",
"강아지": "Puppy",
"곰": "Bear",
"여우": "Fox",
"판다": "Panda",
"코알라": "Koala",
"오리": "Duck",
"동네 사람 14명 · 스토리 모드에만 나와요": "14 neighbors · Story Mode only",
"매일 첫 번째·두 번째 손님은 항상 동물이에요. 세 번째 손님부터 <b>6명 중 1명</b>꼴로 동네 사람이 와요.": "The first and second customers each day are always animals. From the third, about <b>1 in 6</b> is a neighbor.",
"하루에 한 명(Day 9부터는 두 명)까지, 같은 사람은 하루에 한 번만 와요. 동네 사람이 그냥 떠나면 만족도 <b>-15</b>예요 (나그네는 -20).": "Up to one a day (two from Day 9), each person once a day. A neighbor who leaves unserved costs <b>-15</b> (the wanderer -20).",
"택배기사": "Courier",
"1~2개 주문. 인내심이 보통 손님의 <b>40%</b>뿐이라 아주 급해요.": "Orders 1–2. Only <b>40%</b> of normal patience — in a big hurry.",
"인내심이 60% 넘게 남았을 때 다 건네면 한 개에 <b>600원</b>씩 팁 (보통 손님은 200원).": "Serve everything with over 60% patience left for a <b>₩600</b> tip per bread (normal customers: ₩200).",
"유치원 원장님": "Kindergarten Principal",
"<b>6~9개</b> 단체 주문 (Day 1은 70%, Day 2는 85%로 줄여서 와요).": "Group order of <b>6–9</b> (cut to 70% on Day 1 and 85% on Day 2).",
"인내심이 <b>2.5배</b>라 느긋해요.": "<b>2.5×</b> patience — very relaxed.",
"다 건네면 단체 보너스 <b>3,000원</b> + 만족도 <b>+3</b>.": "Serve it all for a group bonus of <b>₩3,000</b> + satisfaction <b>+3</b>.",
"동네 할아버지": "Grandpa Next Door",
"2~3개 주문, 인내심 1.2배.": "Orders 2–3, patience ×1.2.",
"처음 온 날의 주문이 <b>단골 주문</b>이 돼요. 다음부터는 \"늘 먹던 걸로\"만 말하고 개수가 <b>?</b>로 가려져요.": "His first order becomes his <b>usual</b>. After that he only says \"the usual\" and the count shows as <b>?</b>.",
"한 번에 맞게 주면 팁 <b>2배</b> + 만족도 <b>+3</b>. 틀리면 주문을 다시 알려 줘요.": "Get it right the first time for a <b>2×</b> tip + satisfaction <b>+3</b>. Get it wrong and he tells you again.",
"초등학생 (여자아이)": "Schoolkid (girl)",
"1개 주문. 500원밖에 없어서 <b>500원</b>에 팔아요 (팁 없음).": "Orders 1. She only has ₩500, so you sell it for <b>₩500</b> (no tip).",
"대신 만족도 <b>+2</b>.": "Satisfaction <b>+2</b> instead.",
"초등학생 (남자아이)": "Schoolkid (boy)",
"1~3개 주문.": "Orders 1–3.",
"받는 도중에 주문을 <b>한 번 바꿔요</b> (하나 더 달라거나, 남은 것의 종류를 바꾸거나). 말풍선을 잘 보세요!": "<b>Changes his order once</b> while being served (asks for one more, or switches the rest). Watch the bubble!",
"윤이 엄마": "Yuni's Mom",
"3~5개 주문, 단골이라 <b>30% 싸게</b> 팔아요.": "Orders 3–5; a regular, so you sell at <b>30% off</b>.",
"기분 좋게 가면 동네에 소문을 내서 <b>30초 동안</b> 손님이 더 자주 와요.": "If she leaves happy she spreads the word: customers come more often for <b>30 seconds</b>.",
"한 번이라도 기분 좋게 다녀가면 윤이·현이가 보너스를 줘요.": "If she has ever left happy, Yuni and Hyun give bonuses.",
"윤이": "Yuni",
"윤이 엄마의 둘째 아들. 4~6개 주문.": "Yuni's Mom's younger son. Orders 4–6.",
"엄마가 기분 좋게 다녀간 적이 있으면 팁이 <b>1.5배</b>.": "If Mom has left happy before, his tip is <b>1.5×</b>.",
"현이": "Hyun",
"윤이 엄마의 첫째 아들. 서울 수방사에서 근무해서 휴가를 자주 나와요.": "Yuni's Mom's older son. He serves near Seoul, so he's often home on leave.",
"<b>5~8개</b> 주문, 휴가가 짧아 인내심 <b>80%</b>.": "Orders <b>5–8</b>; leave is short, so patience is <b>80%</b>.",
"빨리 건네면 한 개에 <b>400원</b>씩 팁 + 만족도 <b>+3</b>. 엄마가 기분 좋게 다녀갔다면 <b>2,000원</b> 더.": "Serve fast for a <b>₩400</b> tip per bread + satisfaction <b>+3</b>. If Mom left happy, <b>₩2,000</b> more.",
"윤이 아빠": "Yuni's Dad",
"윤이 엄마의 남편이자 윤이·현이의 아빠. 이 게임을 만든 개발자이고, 세상 긍정왕이에요.": "Yuni's Mom's husband and father of Yuni and Hyun. He made this game, and he's the most positive man alive.",
"<b>아무거나 5개</b>: 팥이든 슈크림이든, 섞어서 줘도 돼요. 잘못 건넴이 없어요. 칩에는 \"아무거나 5\"로 보여요.": "<b>5 of anything</b>: red bean or custard, mixed is fine. No wrong hand-overs. The chip shows \"any 5\".",
"인내심 <b>2배</b>, 늦게 줘도 만족도가 깎이지 않아요. 팁은 빠르기와 상관없이 늘 한 개에 <b>200원</b>.": "Patience <b>2×</b>; serving late never lowers satisfaction. Always a <b>₩200</b> tip per bread, however fast.",
"⚡ <b>디버그 모드</b>: 맨 앞에 서 있는 동안 <b>뒤에 선 손님들의 시간이 멈춰요.</b>": "⚡ <b>Debug mode</b>: while he's at the front, <b>time stops for everyone behind him.</b>",
"윤이 엄마가 기분 좋게 다녀간 적이 있으면 <b>1,000원</b> 더. 다른 동네 사람보다 <b>2배 드물게</b> 와요.": "If Yuni's Mom has left happy, <b>₩1,000</b> more. Comes <b>2× more rarely</b> than other neighbors.",
"그래도 너무 오래 기다리게 하면 화가 나서 떠나요: 만족도 <b>-15</b>.": "Still, keep him waiting too long and he leaves angry: satisfaction <b>-15</b>.",
"배고픈 나그네": "Hungry Wanderer",
"1~2개를 달라고 해요. <b>돈은 받지 못해요</b> (재료비만 들어요).": "Asks for 1–2. <b>Pays nothing</b> (you only pay ingredients).",
"건네면 만족도 <b>+3</b>.": "Serve him for satisfaction <b>+3</b>.",
"못 주고 떠나면 동네에 나쁜 소문이 나서 만족도 <b>-20</b>! 꼭 챙겨 주세요.": "If he leaves unserved, bad rumors spread: satisfaction <b>-20</b>! Take care of him.",
"건물주 아저씨": "Landlord",
"주문하지 않아요. 3초 동안 건물 자랑을 실컷 하고 <b>5,000~20,000원</b> 용돈만 주고 가요. 🍀": "Doesn't order. Brags about his buildings for 3 seconds and just gives you <b>₩5,000–20,000</b> pocket money. 🍀",
"다른 특별 손님보다 <b>3배 드물게</b> 와요. 봉투를 눌러도 안 받아요.": "Comes <b>3× more rarely</b> than other specials. Won't take bread from the bag.",
"외국인 관광객": "Tourist",
"2~4개 주문, 영어로 말해요.": "Orders 2–4, speaks English.",
"빨리 건네면 한 개에 <b>500원</b>씩 팁.": "Serve fast for a <b>₩500</b> tip per bread.",
"닭살 커플": "Lovey-Dovey Couple",
"둘이 나눠 먹는 <b>세트</b> 주문: 팥·슈크림 1개씩 또는 2개씩 (슈크림이 없는 날은 팥 2개).": "A <b>set</b> order to share: 1 or 2 each of red bean and custard (2 red bean on days without custard).",
"한 번에 맞게 주면 만족도 <b>+4</b>.": "Get it right in one go for satisfaction <b>+4</b>.",
"한 번이라도 잘못 주면 바로 화가 나서 만족도 <b>-6</b>, 보너스도 없어요.": "One wrong hand-over and they're upset: satisfaction <b>-6</b>, no bonus.",
"산타 할아버지": "Santa Claus",
"<b>마지막 날(Day 15)</b>에만, 장사가 <b>절반쯤</b> 지났을 때 <b>딱 한 번</b> 오는 보스예요.": "A boss who comes <b>only on the last day (Day 15)</b>, <b>once</b>, about <b>halfway</b> through business.",
"<b>12~14개</b>를 팥·슈크림 반반으로 주문해요. 인내심 3배.": "Orders <b>12–14</b>, half red bean and half custard. Patience ×3.",
"🎄 <b>산타의 마법</b>: 산타가 맨 앞에서 주문하는 동안 <b>뒤 손님 인내심 · 새 손님 · 남은 장사 시간이 모두 멈춰요.</b> 산타에게만 집중하세요!": "🎄 <b>Santa's magic</b>: while Santa orders at the front, <b>patience of those behind, new arrivals and the day clock all stop.</b> Focus only on Santa!",
"🔥 산타가 떠나면 <b>마지막 러시</b>: 남은 시간 동안 손님이 더 자주 오고 덜 기다려요.": "🔥 When Santa leaves, the <b>final rush</b>: for the rest of the day customers come more often and wait less.",
"다 건네면 선물 <b>100,000원</b> + 만족도 <b>+5</b>. 못 주면 만족도 <b>-15</b>.": "Serve it all for a <b>₩100,000</b> gift + satisfaction <b>+5</b>. Fail and satisfaction <b>-15</b>.",
"알겠어요": "Got it",
"제작 : cnation(문명국) · 문의 : <a href=\"mailto:mmk75@naver.com\">mmk75@naver.com</a>": "Made by cnation · Contact: <a href=\"mailto:mmk75@naver.com\">mmk75@naver.com</a>",
"3분 동안 최대한 많이 팔아 보세요! 동물 손님만 와요. 어떤 붕어빵으로 도전할까요?": "Sell as much as you can in 3 minutes! Only animal customers come. Which fish bread will you take on?",
"팥<small id=\"ch-bean-best\"></small>": "Red bean<small id=\"ch-bean-best\"></small>",
"팥 &amp; 슈크림<small id=\"ch-mix-best\"></small>": "Red bean &amp; custard<small id=\"ch-mix-best\"></small>",
"닫기": "Close",
"잠깐 쉬는 중": "Taking a break",
"계속하기": "Continue",
"처음부터 다시 하기": "Restart",
"처음 화면으로": "Back to title",
"처음 화면으로 나가면 오늘 장사는 저장되지 않고,<br>다음에 오늘 아침부터 다시 해요.": "If you go to the title now, today's business isn't saved;<br>next time you'll start again from this morning.",
"겨울 보름(Day 1~15) 동안 손님 만족도를 지키며 붕어빵 가게를 키워 보세요. 엔딩 때 가진 돈으로 랭킹이 정해져요.": "Run a fish bread stand for half a winter month (Day 1–15) while keeping customers happy. Your money at the ending decides your ranking.",
"이어하기<small id=\"story-continue-info\"></small>": "Continue<small id=\"story-continue-info\"></small>",
"새로 시작": "New game",
"새로 시작할까요?": "Start a new story?",
"지금까지 진행한 스토리가 지워져요.": "Your current story progress will be deleted.",
"취소": "Cancel",
"화면을 터치하면 장사를 시작해요": "Tap the screen to open the stand",
"장사 정산": "Daily results",
"상점으로": "To the shop",
"상점": "Shop",
"가진 돈 <b id=\"shop-money\">0원</b>": "Money <b id=\"shop-money\">₩0</b>",
"다음 날 장사하러 가기": "Open the stand for the next day",
"게임 오버": "Game over",
"모은 돈": "Money saved",
"0원": "₩0",
"문을 닫은 날": "Closed on",
"랭킹에 남길 이름 (8자까지)": "Name for the ranking (up to 8 letters)",
"이름": "Name",
"랭킹에 올리기": "Post to ranking",
"엔딩": "Ending",
"랭킹에 올리지 않고 처음 화면으로": "Back to title without posting",
"스토리": "Story",
"3분 팥": "3-Min Bean",
"3분 팥&슈": "3-Min Mix",
"🌏 전체": "🌏 Global",
"📱 내 기기": "📱 This device",
"확인": "OK",
"업데이트 기록": "Update history",
"정산 화면처럼 내용이 긴 창이 화면 밖으로 잘리고 스크롤도 안 되던 문제를 고쳤어요. 이제 창 안에서 위아래로 밀어 볼 수 있어요": "Fixed long windows (like the results screen) being cut off with no scrolling. You can now scroll inside the window",
"스토리 모드 Day 14가 다시 조금 바빠졌어요": "Story Mode Day 14 is a little busier again",
"마지막 날 Day 15는 장사가 2분으로 길어지고 더 바빠졌어요. 산타 할아버지는 장사가 절반쯤 지났을 때 와요": "The last day, Day 15, now lasts 2 minutes and is busier. Santa arrives about halfway through",
"🔥 산타가 떠나면 마지막 러시! 남은 시간 동안 손님이 더 자주 오고 덜 기다려요": "🔥 When Santa leaves, the final rush! Customers come more often and wait less for the rest of the day",
"산타 할아버지 주문이 12~14개로 줄었어요": "Santa's order is now 12–14",
"🎄 산타의 마법: 산타가 맨 앞에서 주문하는 동안 뒤 손님 · 새 손님 · 남은 장사 시간이 모두 멈춰요": "🎄 Santa's magic: while Santa orders at the front, customers behind, new arrivals and the day clock all stop",
"스토리 모드 Day 14가 조금 여유로워졌어요 (손님 간격·인내심을 늘리고, 주문은 최대 4개)": "Story Mode Day 14 is a bit more relaxed (longer gaps and patience, orders up to 4)",
"스토리 모드 Day 5~7이 조금 바빠졌어요 (손님이 더 자주 오고 조금 덜 기다려요, Day 7부터 4개 주문)": "Story Mode Days 5–7 are a bit busier (customers come more often and wait a little less; orders of 4 from Day 7)",
"스토리 모드 Day 11~13이 조금 여유로워졌어요 (손님 간격·인내심을 늘리고, Day 13 주문은 최대 4개)": "Story Mode Days 11–13 are a bit more relaxed (longer gaps and patience; Day 13 orders up to 4)",
"스토리를 새로 시작했을 때 동네 할아버지가 처음 오면 게임이 멈추던 문제를 고쳤어요": "Fixed the game freezing when Grandpa visited for the first time after starting a new story",
"3분 챌린지 정산 화면 버튼을 [랭킹에 올리기] · [다시 하기] · [처음 화면으로] 세 가지로 정리했어요": "The challenge results screen now has three buttons: [Post to ranking] · [Play again] · [Back to title]",
"인터넷이 느리거나 컴퓨터에서 파일을 바로 열 때, 장사를 시작하면 시계가 3:00에서 멈추고 손님이 안 나오던 문제를 고쳤어요": "Fixed the clock stopping at 3:00 with no customers when starting business on a slow connection or from a file on a computer",
"3분 챌린지 손님 간격을 줄 서기에 맞게 늘렸어요 (1단계 3~4초, 2단계 2~3초, 3단계 1.2~1.8초마다). 앞 손님을 보내자마자 다음 손님이 오는 느낌이 줄었어요": "Longer customer gaps in the challenge to suit the line (every 3–4s, 2–3s, 1.2–1.8s by stage). The next customer no longer seems to appear the moment you serve one",
"스토리 모드 Day 1·2에 손님이 조금 더 자주 와요 (Day 1: 6~8초, Day 2: 4.8~6.5초마다)": "Customers come a bit more often on Story Days 1–2 (Day 1: every 6–8s, Day 2: every 4.8–6.5s)",
"새 동네 사람 윤이 아빠! 이 게임을 만든 개발자이자 세상 긍정왕이에요. \"아무거나 5개\"를 주문하고, 팥·슈크림을 섞어 줘도 돼요": "New neighbor: Yuni's Dad! He made this game and is the most positive man alive. He orders \"5 of anything\" — mixing red bean and custard is fine",
"윤이 아빠가 맨 앞에 서 있는 동안에는 ⚡ 디버그 모드로 뒤에 선 손님들의 시간이 멈춰요": "While Yuni's Dad is at the front, ⚡ debug mode stops time for the customers behind him",
"손님이 정해진 간격마다 와요. 앞 손님을 빨리 보냈다고 다음 손님이 당겨서 오지 않아요 (스토리 모드 · 3분 챌린지 모두)": "Customers arrive on a fixed schedule. Serving fast no longer pulls the next customer in early (Story Mode and challenge)",
"줄이 꽉 찼을 때 앞 손님이 떠나자마자 새 손님이 바로 채워지던 문제를 고쳤어요": "Fixed a new customer filling a full line the moment the front customer left",
"스토리 모드 손님 줄이 더 빨리 길어져요: Day 2부터 최대 2명, Day 4부터 최대 3명 (Day 9부터 4명은 그대로)": "Story lines grow sooner: up to 2 from Day 2 and up to 3 from Day 4 (4 from Day 9 as before)",
"Day 2·3에 손님이 더 자주 와요 (Day 2: 5~7초마다, Day 3: 4.5~6초마다)": "Customers come more often on Days 2–3 (Day 2: every 5–7s, Day 3: every 4.5–6s)",
"틀이 Day 4(슈크림이 나오는 날)부터 9개로 늘어나요 (전에는 Day 5)": "9 molds from Day 4 (when custard arrives) instead of Day 5",
"스토리 엔딩 화면은 기록이 모두 나타나고 1.5초 뒤부터 천천히 내려가요": "The story ending scrolls down slowly 1.5s after all records appear",
"업데이트한 뒤 홈 화면 앱이 예전 파일을 섞어 써서 게임이 시작하자마자 멈추던 문제를 막았어요. 이제 업데이트하면 항상 새 파일을 받아요": "Fixed home-screen apps mixing old files after an update and freezing at the start. Updates now always fetch fresh files",
"3분 챌린지에도 손님이 줄을 서요: 처음 20초는 1명, 20초부터 최대 2명, 2단계 3명, 3단계 밤 러시는 최대 5명": "Customers line up in the challenge too: 1 for the first 20s, up to 2 after that, 3 in stage 2 and up to 5 in the stage 3 night rush",
"줄 선 뒤쪽 손님 그림이 계산대 위로 떠서 허리 아래가 잘려 보이던 것을 고쳤어요. 이제 모두 계산대에 붙어 서요": "Fixed customers at the back floating above the counter with their cut-off bottoms showing. They now all stand at the counter",
"스토리 엔딩 화면이 길면 천천히 아래로 내려가요 (화면을 만지면 멈춰요)": "A long story ending scrolls down slowly (touch to stop)",
"스토리 모드를 하고 3분 챌린지를 하면 말풍선 위에 특별 손님 이름표가 남아 있던 문제를 고쳤어요": "Fixed a special guest's name tag staying on the bubble in the challenge after playing Story Mode",
"스토리 엔딩에서 [랭킹에 올리기]를 눌러도 아무 일이 없던 문제를 고쳤어요": "Fixed [Post to ranking] doing nothing on the story ending",
"엔딩에서 랭킹에 올리지 않고 처음 화면으로 나갈 수 있어요": "You can leave the ending for the title without posting to the ranking",
"엔딩 화면에 보름 동안의 장사 기록이 한 줄씩 나타나요: 판 붕어빵, 가장 많이 번 날, 실수 없는 날, 만난 동네 사람, 날마다 번 돈 그래프": "The ending now shows your half-month records line by line: fish bread sold, best day, mistake-free days, neighbors met and a daily earnings chart",
"스토리 모드 정산 화면 뒤 위쪽 만족도 숫자가 엉뚱하게(70) 보이던 문제를 고쳤어요": "Fixed the satisfaction number behind the story results showing the wrong value (70)",
"이미 다 받은 종류를 한 번 더 누르면 \"잘못 건넴\"으로 세서 만족도가 깎이던 문제를 고쳤어요 (이제 안내만 떠요)": "Fixed tapping a kind the customer already got in full counting as a wrong hand-over (now just a hint)",
"만족도가 바뀔 때 만족도 칸 아래에 +2, -12처럼 바로 보여 주고, 깎이면 칸이 빨갛게 깜빡여요": "Satisfaction changes now pop up as +2 or -12 under the gauge, and the gauge flashes red on a drop",
"스토리 모드의 \"그날 처음부터 다시\"를 없앴어요. 게임 오버가 되면 그 스토리는 끝나요": "Removed \"retry the day\" from Story Mode. Game over ends the story",
"게임 오버로 끝나도 그때까지 모은 돈으로 랭킹에 이름을 올릴 수 있어요 (전에는 입력칸이 나오지 않았어요)": "You can post to the ranking with the money saved even after a game over (there was no name field before)",
"3분 챌린지가 1분마다 3단계로 빨라져요: 아침 → 저녁 → 밤 러시. 단계가 오를 때 크게 알려 주고 음악도 빨라져요": "The challenge speeds up in three 1-minute stages: morning → evening → night rush, with a banner and faster music",
"3분 챌린지에도 손님 만족도가 생겼어요 (스토리 모드와 같은 규칙). 0%가 되면 장사가 일찍 끝나요": "The challenge now has customer satisfaction too (same rules as Story Mode). At 0% the run ends early",
"3분 챌린지 순위는 최종 점수(순이익 × 만족도 배수)로 매겨요. 그래서 3분 챌린지 랭킹을 새로 시작했어요": "Challenge rankings now use the final score (profit × satisfaction multiplier), so they started fresh",
"3분 챌린지도 스토리 모드처럼 봉투를 한 번 누를 때마다 붕어빵이 한 개씩 나가요. 말풍선 아래에 남은 개수가 보여요": "In the challenge, each tap of the bag hands over one fish bread like in Story Mode, with the remaining count under the bubble",
"스토리 모드 만족도가 더 깐깐해졌어요: 70%에서 시작하고, 80%가 넘으면 오르는 양이 절반이에요": "Story satisfaction is stricter: starts at 70%, and gains are halved above 80%",
"빨리 건네면 +2, 오래 기다리게 하면 0 또는 -1. 콤보 보너스는 5명 연속마다": "Serve fast for +2; keep them waiting for 0 or -1. Combo bonus every 5 in a row",
"손님이 떠나면 -12(동네 사람은 -15), 탄 붕어빵 -3, 안 시킨 종류 -4로 실수가 더 아파요": "A customer leaving costs -12 (neighbors -15), burnt bread -3, the wrong kind -4 — mistakes hurt more",
"새 특별 손님 5명! 배고픈 나그네 · 건물주 아저씨 · 외국인 관광객 · 닭살 커플 · 산타 할아버지": "5 new special guests! Hungry Wanderer · Landlord · Tourist · Lovey-Dovey Couple · Santa Claus",
"산타 할아버지는 마지막 날에 딱 한 번 오는 보스예요. 큰 주문을 다 건네면 10만 원 선물!": "Santa is a boss who comes once on the last day. Serve his big order for a ₩100,000 gift!",
"게임 방법 맨 아래에 손님 소개를 넣었어요. 동네 사람 13명의 특징을 정확히 알 수 있어요": "Added Meet the Customers at the bottom of How to Play, with the exact rules of all 13 neighbors",
"현이가 서울 수방사에서 근무해서 휴가를 자주 나와요. 이제 다른 동네 사람처럼 언제든 와요": "Hyun serves near Seoul and is often home on leave, so he can now come any day like other neighbors",
"동네 사람들(특별 손님 8명)이 Day 1부터 모두 와요. 윤이와 현이도 엄마·동생을 먼저 만나지 않아도 와요": "All neighbors (8 special guests) visit from Day 1. Yuni and Hyun come even before you meet Mom or each other",
"Day 1~2에는 틀이 적어서 단체 주문 개수를 조금 줄였어요": "Group orders are a bit smaller on Days 1–2 while there are fewer molds",
"상점의 큰 봉투 2단계(9개 → 12개) 가격을 10,000원에서 22,000원으로 올렸어요": "The shop's Big Bag level 2 (9 → 12) now costs ₩22,000 instead of ₩10,000",
"스토리 모드에서 매일 첫 번째·두 번째 손님은 항상 동물 손님이 와요 (붕어빵을 굽기도 전에 급한 특별 손님이 오지 않게)": "In Story Mode the first and second customers each day are always animals (so no rushed special guest before you've baked anything)",
"인터넷이 안 될 때도 🌏 전체 랭킹에 마지막으로 받은 목록을 보여 줘요": "🌏 Global ranking shows the last list it received even when you're offline",
"온라인 랭킹! 랭킹 화면에서 🌏 전체(모든 사람의 기록)와 📱 내 기기 기록을 나눠 볼 수 있어요": "Online ranking! See 🌏 Global (everyone's records) and 📱 This device separately",
"랭킹에 올린 기록은 전체 랭킹에도 함께 올라가요 (인터넷이 끊겨 있으면 이 기기에만 저장돼요)": "Records you post also go to the global ranking (offline they're saved on this device only)",
"특별 손님 대사가 길 때 이름표가 말풍선 글자를 가리던 문제를 고쳤어요": "Fixed a name tag covering the text when a special guest's line was long",
"새 손님 14명! 고양이·강아지·곰·여우·판다·코알라·오리가 손님으로 와요": "14 new customers! Cat, puppy, bear, fox, panda, koala and duck join as customers",
"스토리 모드에 특별 손님 8명: 택배기사·동네 할아버지·초등학생 둘·윤이 엄마·유치원 원장님·윤이·현이, 저마다 다른 규칙이 있어요": "8 special guests in Story Mode: Courier, Grandpa Next Door, two schoolkids, Yuni's Mom, Kindergarten Principal, Yuni and Hyun, each with their own rules",
"윤이 형 현이는 군 복무 중 휴가를 나와서 스토리 모드 후반에 딱 한 번 와요": "Yuni's brother Hyun visits once late in Story Mode while on leave from the army",
"3분 챌린지를 팥 / 팥 & 슈크림 중에서 골라 시작해요 (동물 손님만 와요)": "Choose Red Bean or Red Bean & Custard when starting the challenge (animal customers only)",
"랭킹을 스토리 모드 · 3분 팥 · 3분 팥 & 슈크림 세 가지로 나눠 기록해요": "Rankings are kept separately for Story Mode · 3-Min Bean · 3-Min Bean & Custard",
"스토리 모드 손님이 줄을 서요: 맨 앞 손님에게 건네고, 뒤에 선 손님은 천천히 지쳐요": "Story customers line up: serve the front one; those behind lose patience slowly",
"슈크림 붕어빵 추가 (Day 4부터), 팥 봉투와 슈크림 봉투가 따로 있어요": "Custard fish bread added (from Day 4), with separate red bean and custard bags",
"봉투를 누를 때마다 한 개씩 건네요. 더 주면 덤, 안 시킨 종류는 돌려받아요": "Each tap of the bag hands over one. Extra is a free gift; the wrong kind is handed back",
"Day 8부터 팥과 슈크림을 섞어 시키는 손님도 와요": "From Day 8 some customers order red bean and custard together",
"손님마다 대사를 5개씩 준비해서, 같은 손님도 올 때마다 다른 말을 해요": "Each customer now has 5 lines, so they say something different each visit",
"붕어빵 틀 그림을 화면 크기에 맞게 가볍게 줄여, 틀을 누를 때 움직임이 더 부드럽게 개선": "Lighter mold images sized to the screen, so tapping molds feels smoother",
"스토리 모드 추가: 겨울 보름(Day 1~15) 동안 손님 만족도를 지키며 가게를 키워요": "Story Mode added: run the stand for half a winter month (Day 1–15) while keeping customers happy",
"하루 시작 이야기, 날마다 늘어나는 손님과 틀(4 → 6 → 9개), 하루 장사 54~96초": "A story each morning, more customers and molds each day (4 → 6 → 9), 54–96 seconds of business a day",
"상점 업그레이드 5종: 화력 강화 · 두꺼운 철판 · 큰 봉투 · 간판 · 가격 인상": "5 shop upgrades: Stronger Fire · Thick Griddle · Big Bag · Sign · Price Increase",
"손님 만족도: 0%가 되면 게임 오버 (그날 다시 하기는 한 번, 재기 비용 50%)": "Customer satisfaction: game over at 0% (one retry of the day, 50% comeback cost)",
"만족도에 따른 엔딩 3종과 스토리 모드 랭킹": "3 endings based on satisfaction and a Story Mode ranking",
"하루가 시작될 때 자동 저장, 이어하기": "Auto-save at the start of each day, and continue",
"기존 3분 장사는 \"3분 챌린지\"로 이름 변경": "The original 3-minute business is renamed \"3-Minute Challenge\"",
"새 손님이 가끔 좌우로 계속 떨리던 문제 수정": "Fixed new customers sometimes shaking side to side",
"시간 · 돈 · 소리 버튼을 천막 위로 올려 가게 풍경이 더 넓게 보이도록 변경": "Moved the time, money and sound buttons onto the awning so you can see more of the street",
"봉투에 담은 개수와 최대 개수를 함께 표시 (예: 3/9)": "The bag shows its count and capacity (e.g. 3/9)",
"장사가 끝나고 남은 붕어빵은 동네 이웃에게 나눠 줬다고 알려 줌 (보상은 없어요)": "Leftover fish bread at closing is shared with the neighbors (no reward)",
"마감 직전에 손님이 오지 않는 시간을 4초에서 2초로 줄임": "Customers stop arriving 2 seconds before closing instead of 4",
"반죽 위에 올리는 팥을 듬뿍 담은 그림으로 변경": "New picture of the red bean filling, heaped on the batter",
"반죽을 부으면 틀 안에서 반죽이 퍼져 나가는 장면 추가": "Added batter spreading across the mold when you pour",
"반죽과 팥을 올린 붕어빵에는 무늬가 없고, 뒤집어야 무늬가 보이도록 그림 변경": "Bread with batter and filling has no pattern until you flip it",
"긴 대사일 때 손님 인내심 바가 얇아지던 문제 수정": "Fixed the patience bar getting thin with long lines",
"\"굽는 법\"을 \"게임 방법\"으로 바꾸고, 굽는 법 아래에 자세한 게임 방법 추가": "Renamed \"How to bake\" to \"How to Play\" and added detailed rules",
"첫 로딩 화면 제목의 \"cnation\"을 가운데로 정렬": "Centered \"cnation\" in the loading screen title",
"게임 이름을 \"cnation 붕어빵 타이쿤\"으로 통일하고 타이틀 화면 제목 디자인 변경": "Unified the game name as \"cnation Fish Bread Tycoon\" and redesigned the title",
"홈 화면에 추가하면 \"cnation 붕어빵\"이라는 이름으로 표시": "Shows as \"cnation Fish Bread\" when added to the home screen",
"굽는 법과 업데이트 기록 화면 아래에 제작·문의 안내 추가": "Added credits and contact under How to bake and Update history",
"타이틀 화면 오른쪽 위에 소리 켜기/끄기 버튼 추가": "Added a sound on/off button at the top right of the title screen",
"업데이트 기록 글자 크기 조정": "Adjusted the update history text size",
"굽는 법과 업데이트 기록을 읽기 쉬운 글꼴(IBM Plex Sans KR)로 변경": "How to bake and Update history use an easy-to-read font (IBM Plex Sans KR)",
"게임 전용 폰트 \"동글(Dongle)\" 적용": "Applied the game font \"Dongle\"",
"시간 숫자가 바뀔 때 글자가 좌우로 흔들리지 않도록 개선": "Time digits no longer wobble when they change",
"아줌마 손님 새 대사: \"붕어빵 빨리요~ 우리 윤이가 엄청 좋아한단 말이에요~\"": "New line for the auntie customer: \"Quick, please~ my Yuni loves these!\"",
"긴 대사는 말풍선이 커져서 글자가 작아지지 않도록 개선": "Long lines make the bubble bigger instead of shrinking the text",
"처음 접속할 때 \"게임 데이터를 불러오는 중입니다\" 로딩 화면 추가": "Added a \"Loading game data\" screen on first visit",
"iPhone에서 타이틀 음악이 나오지 않던 문제 수정": "Fixed the title music not playing on iPhone",
"음악이 갑자기 크게 시작하지 않고 서서히 커지도록 개선": "Music fades in instead of starting loud",
"장사 중 일시정지 버튼 추가 (소리 버튼 옆): 계속하기 · 처음부터 다시 하기 · 처음 화면으로": "Pause button during business (next to sound): continue · restart · back to title",
"다른 앱으로 나갔다 오면 자동으로 일시정지": "Auto-pause when you switch to another app",
"게임 초반 빨간 화살표 안내 삭제": "Removed the red arrow hint at the start",
"손님 대사와 인내심 바가 말풍선 밖으로 나가던 문제 수정": "Fixed lines and the patience bar spilling out of the bubble",
"새 손님이 올 때 이전 손님 그림이 잠깐 보이던 문제 수정": "Fixed the previous customer's picture flashing when a new one arrives",
"cnation 붕어빵 타이쿤 첫 정식 버전": "First official version of cnation Fish Bread Tycoon",
"반죽 → 팥 → 두 번 뒤집기 → 봉투에 담아 손님에게 건네기": "Batter → red bean → flip twice → bag it and hand it to the customer",
"하루 3분 장사: 아침 → 노을 → 밤으로 갈수록 바빠지고, 장사가 끝나면 정산과 최고 기록": "3 minutes of business a day: busier from morning to sunset to night, with results and a best record",
"cnation 스타일로 새로 그린 그림과 손님 10종": "New artwork in the cnation style and 10 customers",
"새 배경음악: 타이틀 1곡, 장사 음악 3곡 중 날마다 하나": "New music: 1 title track and 3 business tracks, one picked each day",
"같은 손님이 연달아 오지 않도록 개선": "The same customer no longer comes twice in a row",
"iPhone 소리 크기 개선, 첫 터치 소리 안내": "Better sound volume on iPhone and a first-tap sound hint",
"그림과 음악 파일을 가볍게 줄여 로딩 속도 개선": "Lighter images and music for faster loading",
"오늘의 장사 정산": "Today's results",
"판매한 붕어빵": "Fish bread sold",
"0개": "0",
"판매 매출": "Sales",
"+0원": "+₩0",
"손님 팁": "Tips",
"재료비 (반죽 1회 300원)": "Ingredients (₩300 per batter)",
"-0원": "-₩0",
"태운 붕어빵 · 놓친 손님": "Burnt · missed customers",
"0개 · 0명": "0 · 0",
"순이익": "Profit",
"손님 만족도 (점수 배수)": "Satisfaction (score multiplier)",
"최종 점수": "Final score",
"0점": "0 pts",
"랭킹에 남길 이름": "Name for the ranking",
"다시 하기": "Play again",
"🌇 2단계 · 저녁 손님이 몰려와요!": "🌇 Stage 2 · Evening crowd incoming!",
"🌙 3단계 · 밤 러시! 마지막 1분!": "🌙 Stage 3 · Night rush! Last minute!",
"3분 챌린지 팥": "3-Min Challenge · Red Bean",
"3분 챌린지 팥 & 슈크림": "3-Min Challenge · Bean & Custard",
"와! 따끈따끈해서 최고예요!": "Wow! Nice and hot, the best!",
"고마워요, 또 올게요!": "Thanks, I'll be back!",
"냄새부터 맛있네요~": "Smells delicious already~",
"이 집 붕어빵이 최고야!": "This place makes the best fish bread!",
"아직 쓸 수 없는 틀이에요": "This mold isn't available yet",
"빈 틀이에요. 반죽부터 부어요": "It's empty. Pour batter first",
"반죽부터 부어요": "Pour batter first",
"반죽을 붓는 중이에요": "Still pouring batter",
"팥이나 슈크림을 올려요": "Add red bean or custard",
"팥을 올려요": "Add red bean",
"꼬챙이로 뒤집어요": "Flip it with the skewer",
"아직 굽는 중이에요": "Still baking",
"꼬챙이로 한 번 더 뒤집어요": "Flip it once more with the skewer",
"꼬챙이로 봉투에 담아요": "Bag it with the skewer",
"슈크림 봉투가 꽉 찼어요": "The custard bag is full",
"팥 봉투가 꽉 찼어요": "The red bean bag is full",
"봉투가 꽉 찼어요": "The bag is full",
"꼬챙이로 탄 붕어빵을 치워요": "Clear the burnt bread with the skewer",
"손님이 아직 없어요": "No customer yet",
"그건 이미 다 드렸어요": "They already have all of those",
"그건 안 시켰어요!": "I didn't order that!",
"슈크림 봉투가 비었어요": "The custard bag is empty",
"팥 봉투가 비었어요": "The red bean bag is empty",
"봉투가 비었어요": "The bag is empty",
"붕어빵은 안 드신대요": "He doesn't want any fish bread",
"너무 오래 기다려서 그냥 갈게요...": "I waited too long... I'm leaving.",
"뒤집어요!": "Flip!",
"다 익었어요!": "Done!",
"슈": "C",
"이름 없음": "No name",
"3분 챌린지 팥 & 슈크림 정산": "3-Min Challenge · Bean & Custard Results",
"3분 챌린지 팥 정산": "3-Min Challenge · Red Bean Results",
"🌏 전체 1위 기록이에요!": "🌏 A new global #1!",
"🌏 전체 랭킹에 오를 수 있어요!": "🌏 You can make the global ranking!",
"🎉 내 최고 기록이에요!": "🎉 Your best record!",
"아직 기록 없음": "No record yet",
"눈 내리는 골목에 작은 붕어빵 가게를 열었다. 오늘은 첫날, 천천히 해 보자!": "I opened a little fish bread stand in a snowy alley. It's the first day — let's take it slow!",
"어제 왔던 손님이 친구를 데려왔다! 손님이 늘 것 같아 철판을 바꿨다. 이제 틀이 6개다.": "Yesterday's customer brought a friend! I expect more customers, so I got a new griddle. Now there are 6 molds.",
"동네 아이들이 학교 끝나고 들르기 시작했다.": "Neighborhood kids started stopping by after school.",
"\"슈크림 붕어빵은 없어요?\" 손님 말에 슈크림을 준비했다! 철물점 아저씨가 큰 철판도 달아 주셔서 틀이 9개가 됐다!": "\"Do you have custard fish bread?\" So I got custard ready! The hardware store man installed a big griddle too — now there are 9 molds!",
"큰 철판에 손이 익어 간다. 오늘도 힘내 보자!": "I'm getting used to the big griddle. Let's do our best today!",
"옆 골목에서도 우리 가게 이야기를 한다는데…?": "I hear people in the next alley are talking about my stand…?",
"주말이다! 아침부터 손님들이 줄을 섰다.": "It's the weekend! Customers lined up since morning.",
"\"팥이랑 슈크림 섞어서 주세요!\" 주문이 점점 까다로워진다.": "\"Red bean and custard mixed, please!\" Orders are getting trickier.",
"단골손님이 생겼다. 이름도 기억해 주신다.": "I have regulars now. They even remember my name.",
"보름의 절반이 지났다. 지금까지 잘해 왔어!": "Halfway through! You've done great so far!",
"한파 주의보! 몸 녹이러 오는 손님들로 북적인다.": "Cold wave warning! The stand is packed with people warming up.",
"동네 신문에 우리 가게가 실렸다. 오늘은 더 바빠질 것 같다.": "My stand made the local paper. Today will be even busier.",
"손이 빨라졌다. 이제 철판 소리만 들어도 언제 뒤집을지 안다.": "My hands are quick now. I can tell when to flip just by the sizzle.",
"마지막 주말. 동네 사람들이 모두 들르는 것 같다.": "The last weekend. It feels like the whole neighborhood is stopping by.",
"보름의 마지막 날. 골목에 산타 할아버지가 나타났다는 소문이…! 오늘을 최고의 하루로 만들자!": "The last day. Rumor says Santa Claus was seen in the alley…! Let's make today the best day ever!",
"화력 강화": "Stronger Fire",
"두꺼운 철판": "Thick Griddle",
"큰 봉투": "Big Bag",
"간판": "Sign",
"가격 인상": "Price Increase",
"손님이 오는 빠르기 그대로": "Normal customer pace",
"저장하지 못했어요. 저장 공간을 확인해 주세요.": "Couldn't save. Please check your storage space.",
"🍮 슈크림 메뉴 추가! 반죽 위에 슈크림을 올려 구워요. 슈크림 붕어빵은 200원 더 받아요.": "🍮 Custard menu added! Put custard on the batter. Custard fish bread sells for ₩200 more.",
"📝 이제 팥과 슈크림을 섞어 시키는 손님도 와요.": "📝 Now some customers order red bean and custard together.",
"오늘 순이익": "Today's profit",
"가진 돈": "Money",
"빠른 제공 · 떠난 손님 · 탄 붕어빵": "Fast serves · left · burnt",
"덤으로 준 붕어빵 · 잘못 건넨 횟수": "Free extras · wrong hand-overs",
"오늘의 특별 손님": "Today's special guests",
"엔딩 보기": "See the ending",
"최고 단계": "Max level",
"자신 있을 때": "For pros",
"⭐ 동네 명물 엔딩": "⭐ Neighborhood Legend Ending",
"줄 서서 먹는 집이 되었어요! 동네 사람 모두가 우리 붕어빵을 기억해요.": "People line up for your fish bread! The whole neighborhood will remember it.",
"단골 가게 엔딩": "Favorite Stand Ending",
"손님들이 내년 겨울에도 꼭 와 달래요.": "Your customers want you back next winter.",
"무사 완주 엔딩": "Survivor Ending",
"힘들었지만 보름을 끝까지 버텼어요.": "It was tough, but you made it to the end.",
"장사한 날": "Days open",
"판 붕어빵": "Fish bread sold",
"가장 많이 번 날": "Best day",
"실수 없는 날": "Mistake-free days",
"떠난 손님 · 탄 붕어빵": "Left · burnt",
"만난 동네 사람": "Neighbors met",
"날마다 번 돈 (색: 그날 만족도)": "Daily earnings (color: that day's satisfaction)",
"전체 랭킹을 불러오는 중…": "Loading the global ranking…",
"전체 랭킹을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.": "Couldn't load the global ranking. Please check your internet connection.",
"📱 내 기기 기록은 볼 수 있어요.": "📱 You can still see this device's records.",
"아직 전체 기록이 없어요. 첫 기록의 주인공이 되어 보세요!": "No global records yet. Be the first!",
"아직 기록이 없어요. 스토리 모드를 끝까지 해 보세요!": "No records yet. Finish Story Mode!",
"아직 기록이 없어요. 3분 챌린지에 도전해 보세요!": "No records yet. Try the 3-Minute Challenge!",
"(다시 하기 사용)": "(used retry)",
"전체 랭킹에 올리는 중…": "Posting to the global ranking…",
"전체 랭킹에 올리지 못했어요. 이 기기에는 저장했어요.": "Couldn't post to the global ranking. Saved on this device.",
"🔥 마지막 러시! 손님이 몰려와요": "🔥 Final rush! Here they come!",
"⚡ 디버그 모드 ON · 뒤 손님 시간 정지!": "⚡ Debug mode ON · time stops for the line!",
"🎄 산타의 마법! 다른 손님들의 시간이 멈춰요": "🎄 Santa's magic! Time stops for everyone else",
"…분위기 다 깨졌어. 그래도 맛은 있네.": "…Mood ruined. Still tasty, though.",
"고맙네. 이게 내 단골 주문일세, 기억해 두게!": "Thank you. That's my usual — remember it!",
"허허, 다음엔 기억해 주게.": "Heh, remember it next time.",
"엄마랑 윤이가 여기 얘기만 해요! 가족 대표로 감사 인사예요. 충성!": "Mom and Yuni talk about this place all the time! Thanks from the whole family. Salute!",
"집사람이 여기 칭찬을 그렇게 하더라고요! 오늘도 완벽해요~": "My wife can't stop praising this place! Perfect again today~",
"감사합니다!": "Thank you!",
"나눔 완료! 동네에 좋은 소문이 나요": "Shared! Good word spreads in the neighborhood",
"한": "한",
"English / 한국어": "English / 한국어",
"타이틀 화면 오른쪽 위 소리 버튼 옆에 언어 버튼(EN / 한)이 생겼어요. English를 고르면 메뉴·게임 방법·손님 대사·정산·랭킹까지 게임 안의 모든 글이 영어로 나와요": "A language button (EN / 한) is now next to the sound button at the top right of the title screen. Choose English and everything in the game — menus, How to Play, customer lines, results and rankings — appears in English",
"고른 언어는 이 기기에 저장돼서 다음에 열어도 그대로예요": "Your language choice is saved on this device, so it stays the same next time"
};
  const W = (n) => `₩${n}`;
  // 숫자가 들어간 문장 (정규식은 앞뒤 공백을 뺀 전체 문장과 맞춘다)
  const RULES = [
    [/^붕어빵 (\d+)개가 남아서 동네 이웃에게 나눠 줬어요\. 재료비는 날렸지만 기분은 나쁘지 않아요~$/, (m, n) => `${n} leftover fish bread went to the neighbors. The ingredients are lost, but it feels nice~`],
    [/^😟 손님 만족도가 0%가 되어 장사를 일찍 마쳤어요\.\s*(.*)$/, (m, r) => `😟 Satisfaction hit 0%, so the stand closed early.${r ? ' ' + tr(r) : ''}`],
    [/^Day (\d+) 장사 시작!$/, (m, d) => `Day ${d} — open for business!`],
    [/^Day (\d+) 장사 정산$/, (m, d) => `Day ${d} Results`],
    [/^Day (\d+) 장사하러 가기$/, (m, d) => `Open the stand for Day ${d}`],
    [/^Day (\d+)에 열려요$/, (m, d) => `Opens on Day ${d}`],
    [/^Day (\d+)에 열리는 틀이에요$/, (m, d) => `This mold opens on Day ${d}`],
    [/^Day (\d+) · 게임 오버 상태$/, (m, d) => `Day ${d} · Game over`],
    [/^Day (\d+) · ([\d,]+)원 · 만족도 (\d+)%$/, (m, d, w, s) => `Day ${d} · ${W(w)} · Satisfaction ${s}%`],
    [/^손님들이 발길을 끊었어요… Day (\d+)에 가게 문을 닫았습니다\.$/, (m, d) => `Customers stopped coming… The stand closed on Day ${d}.`],
    [/^게임 오버 \(Day (\d+)\)$/, (m, d) => `Game Over (Day ${d})`],
    [/^([\d,]+)원 부족$/, (m, w) => `${W(w)} short`],
    [/^한 면 굽는 시간 ([\d.]+)초$/, (m, s) => `Bake time per side ${s}s`],
    [/^타기까지 ([\d.]+)초$/, (m, s) => `Burns after ${s}s`],
    [/^봉투에 (\d+)개까지$/, (m, n) => `Bag holds ${n}`],
    [/^손님이 (\d+)% 더 자주 와요$/, (m, n) => `Customers come ${n}% more often`],
    [/^붕어빵 ([\d,]+)원 · 손님 인내심 −(\d+)%$/, (m, w, p) => `Fish bread ${W(w)} · Patience −${p}%`],
    [/^손님 인내심 −(\d+)%$/, (m, p) => `Patience −${p}%`],
    [/^붕어빵 ([\d,]+)원$/, (m, w) => `Fish bread ${W(w)}`],
    [/^🔓 틀이 (\d+)개로 늘었어요!$/, (m, n) => `🔓 You now have ${n} molds!`],
    [/^👥 손님이 (\d+)명까지 줄을 서요\.$/, (m, n) => `👥 Up to ${n} customers can line up.`],
    [/^🔥 (\d+)콤보! 만족도 보너스$/, (m, n) => `🔥 ${n} combo! Satisfaction bonus`],
    [/^재료비 \(반죽 1회 ([\d,]+)원\)$/, (m, w) => `Ingredients (${W(w)} per batter)`],
    [/^🏅 내 기기 랭킹 (\d+)위에 오를 수 있어요!$/, (m, n) => `🏅 You can reach #${n} on this device!`],
    [/^전체 1위 기록 ([\d,]+)점$/, (m, n) => `Global #1: ${n} pts`],
    [/^1위 기록 ([\d,]+)점$/, (m, n) => `#1 record: ${n} pts`],
    [/^1위 ([\d,]+)점$/, (m, n) => `#1: ${n} pts`],
    [/^(Day \d+ · )?남은 시간 (\d+:\d+)$/, (m, h, t) => `${h || ''}Time left ${t}`],
    [/^\+([\d,]+)원 \(팁 ([\d,]+)원\)$/, (m, a, b) => `+${W(a)} (tip ${W(b)})`],
    [/^🍀 럭키! 건물주 용돈 \+([\d,]+)원$/, (m, w) => `🍀 Lucky! The landlord gave you +${W(w)}`],
    [/^🎅 산타의 선물 \+([\d,]+)원!$/, (m, w) => `🎅 Santa's gift +${W(w)}!`],
    [/^단체 보너스 \+([\d,]+)원!$/, (m, w) => `Group order bonus +${W(w)}!`],
    [/^가족 보너스 \+([\d,]+)원!$/, (m, w) => `Family bonus +${W(w)}!`],
    [/^인터넷 연결이 안 돼서 마지막으로 받은 목록이에요 \((.+)\)$/, (m, t) => `You're offline. This is the last list received (${t})`],
    [/^게임 데이터를 불러오는 중입니다\.\.\. (\d+)%$/, (m, p) => `Loading game data... ${p}%`],
    [/^만족도 (\d+)%$/, (m, s) => `Satisfaction ${s}%`],
    [/^순이익 (-?[\d,]+)원$/, (m, w) => `Profit ${w.startsWith('-') ? '-' + W(w.slice(1)) : W(w)}`],
    [/^Day (\d+) · (-?)([\d,]+)원$/, (m, d, s, w) => `Day ${d} · ${s}${W(w)}`],
    // 단위만 있는 값
    [/^([+-]?)([\d,]+)원$/, (m, s, w) => `${s}${W(w)}`],
    [/^(\d[\d,]*)개$/, (m, n) => n],
    [/^(\d[\d,]*)명$/, (m, n) => n],
    [/^(\d[\d,]*)번$/, (m, n) => n],
    [/^(-?\d[\d,]*)점$/, (m, n) => `${n} pts`],
    [/^(\d+)일$/, (m, n) => `${n} ${n === '1' ? 'day' : 'days'}`],
  ];

  const memo = new Map();
  // 문장 하나를 영어로. 모르는 문장은 그대로 둔다
  function tr(s) {
    if (LANG !== 'en' || typeof s !== 'string' || !HANGUL.test(s)) return s;
    if (memo.has(s)) return memo.get(s);
    const lead = s.match(/^\s*/)[0], tail = s.slice(lead.length).match(/\s*$/)[0];
    const out = lead + core(s.trim()) + tail;
    memo.set(s, out);
    return out;
  }
  function core(t, quiet) {
    const k = norm(t);
    if (k in EN) return EN[k];
    for (const [re, fn] of RULES) { const m = k.match(re); if (m) return fn(...m); }
    const pre = k.match(/^([^\w가-힣"'(]+)(.*[가-힣].*)$/);   // 앞에 붙은 그림 글자: "🗓️ 장사한 날"
    if (pre && core(pre[2], true) !== pre[2]) return pre[1] + core(pre[2]);
    for (const sep of ['\n', ' → ', ' · ']) {
      if (t.includes(sep)) return t.split(sep).map((p) => tr(p)).join(sep);
    }
    if (k.endsWith(' →')) return tr(k.slice(0, -2)) + ' →';
    if (window.I18N_DEBUG && !quiet) console.warn('[i18n] 번역 없음:', k);
    return t;
  }
  // HTML 조각: 통째로 사전에 있으면 그것, 아니면 태그 사이 글자만 바꾼다
  function trHTML(h) {
    if (LANG !== 'en' || typeof h !== 'string' || !HANGUL.test(h)) return h;
    const k = norm(h);
    if (k in EN) return EN[k];
    return h.split(/(<[^>]*>)/).map((p) => (p.startsWith('<') ? p.replace(/(aria-label|title|placeholder|alt)="([^"]*)"/g, (m, a, v) => `${a}="${tr(v)}"`) : tr(p))).join('');
  }

  const tcDesc = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
  const ihDesc = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  // 남이 쓴 이름처럼 바꾸면 안 되는 HTML을 넣을 때
  const raw = (el, h) => ihDesc.set.call(el, h);

  if (LANG === 'en') {
    Object.defineProperty(Node.prototype, 'textContent', { ...tcDesc, set(v) { tcDesc.set.call(this, typeof v === 'string' ? tr(v) : v); } });
    Object.defineProperty(Element.prototype, 'innerHTML', { ...ihDesc, set(v) { ihDesc.set.call(this, typeof v === 'string' ? trHTML(v) : v); } });

    // 이미 그려진 index.html의 글자들
    document.documentElement.lang = 'en';
    document.title = tr(document.title);
    const RICH = new Set(['B', 'SMALL', 'SPAN', 'BR', 'EM', 'I', 'A', 'STRONG']);
    const walk = (el) => {
      for (const a of ['placeholder', 'aria-label', 'title', 'alt']) {
        const v = el.getAttribute && el.getAttribute(a);
        if (v && HANGUL.test(v)) el.setAttribute(a, tr(v));
      }
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
      const kids = [...el.childNodes];
      const rich = kids.some((n) => n.nodeType === 1) && kids.every((n) => n.nodeType === 3 || (n.nodeType === 1 && RICH.has(n.tagName) && ![...n.children].some((c) => !RICH.has(c.tagName))));
      if (rich && HANGUL.test(el.textContent) && norm(ihDesc.get.call(el)) in EN) { raw(el, EN[norm(ihDesc.get.call(el))]); return; }
      for (const n of kids) {
        if (n.nodeType === 3) { if (HANGUL.test(n.nodeValue)) n.nodeValue = tr(n.nodeValue); }
        else if (n.nodeType === 1) walk(n);
      }
    };
    walk(document.body);
  }

  return { tr, trHTML, raw };
})();
const tr = I18N.tr;

// 영어 주문 말: "2" / "2 red bean" / "1 custard" / "2 red bean & 1 custard" / "5 of anything"
function enOrder(o, withKind) {
  if (o.any) return `${o.any} of anything`;
  if (o.bean && o.cream) return `${o.bean} red bean & ${o.cream} custard`;
  if (o.cream) return `${o.cream} custard`;
  return withKind ? `${o.bean} red bean` : `${o.bean}`;
}
// 영어 주문표: "B2 · C1", 다 받은 종류는 ✓ (left가 없으면 주문 전체, hide면 ?)
function enCount(o, left, hide) {
  const v = (k) => (!left ? o[k] : hide && left[k] ? '?' : left[k] || '✓');
  if (o.any) return `Any ${v('any')}`;
  const parts = [];
  if (o.bean) parts.push(`B${v('bean')}`);
  if (o.cream) parts.push(`C${v('cream')}`);
  return parts.join(' · ');
}

// 손님 대사 (영어). game.js의 CUSTOMERS와 story.js의 SPECIALS 위에 덮어쓴다
const EN_LINES = {
 "alpaca": [
  "Fish bread, {n} please~ It's so cold today.",
  "Even with a scarf it's cold. {n}, please!",
  "{n}, please~ My hands are frozen.",
  "Something warm — {n}, please~",
  "Lots of fluff, still cold. {n}!"
 ],
 "deer": [
  "{n} in my basket, please!",
  "For my forest friends. {n}, please!",
  "My basket is empty. Fill it with {n}~",
  "{n}, please! Snow piled up on my antlers.",
  "Here again today. {n}, please!"
 ],
 "hedgehog": [
  "Um... could I get {n}?",
  "Um... just {n}, please...",
  "Careful not to get poked... {n}...",
  "It's embarrassing, but... {n}, please.",
  "Hmm... I feel like {n} today."
 ],
 "otter": [
  "Warm fish bread, {n} please!",
  "{n}, please! I'll hold them tight.",
  "The river froze solid. {n}!",
  "Fish bread, not clams! {n}, please~",
  "I'll eat them on my belly. {n}!"
 ],
 "owl": [
  "On my delivery route. {n}!",
  "Delivered all night. {n}, please!",
  "{n} before I deliver the letters.",
  "Hoot~ {n}, quickly please!",
  "{n} for my coworkers too!"
 ],
 "penguin": [
  "Wrap up {n}, please! Waddle waddle~",
  "{n}, please! It's colder here than Antarctica.",
  "Waddled all the way here. {n}!",
  "Fish bread instead of fish! {n}, please~",
  "My friends are waiting. {n} to go!"
 ],
 "rabbit": [
  "Wow, smells great! {n}, please!",
  "Ears up! {n}, please~",
  "Fish bread over carrots! {n}!",
  "Hopped all the way here. {n}, please!",
  "Cold even with earmuffs. {n}~"
 ],
 "seal": [
  "Fully stuffed, {n} please!",
  "I wore my hat. {n}, please!",
  "Warmer here than on the ice. {n}!",
  "Clap clap! {n}, please~",
  "Rolled all the way here. {n}!"
 ],
 "cat": [
  "Meow~ {n}, please!",
  "Fish-shaped, I can't walk past. {n}!",
  "Into my bag they go. {n}, please~",
  "Even my whiskers froze. {n}!",
  "Give me {n} warm ones and I'll purr for you~"
 ],
 "dog": [
  "Woof! {n}, please!",
  "I followed the smell! {n}!",
  "My tail won't stop wagging. {n}, please~",
  "For after my walk. {n}!",
  "My ears are cold even in a hat. {n}, please!"
 ],
 "bear": [
  "{n} before I hibernate.",
  "Fish bread instead of honey! {n}, please~",
  "I'm so hungry. {n}!",
  "Into my vest pocket. {n}, please!",
  "I'll wait patiently. {n}~"
 ],
 "fox": [
  "My eyes sparkle! {n}, please~",
  "Even wrapped in my tail I'm cold. {n}!",
  "I heard the rumors. {n}, please!",
  "The most golden ones — {n}~",
  "Hehe, here again today. {n}, please!"
 ],
 "panda": [
  "Fish bread over bamboo! {n}, please~",
  "I came in earmuffs. {n}!",
  "Rolled all the way here. {n}, please~",
  "I wanted just one bite… {n}!",
  "Cozy fish bread, {n} please~"
 ],
 "koala": [
  "Mm… so sleepy… {n}, please…",
  "Came down from my tree. {n}~",
  "Wore my scarf. {n}, please!",
  "Slowly… but warm, {n}…",
  "Fish bread wakes me up. {n}, please!"
 ],
 "duck": [
  "Quack! {n}, please!",
  "The pond froze over. {n}!",
  "Waddled over. {n}, please~",
  "Dressed up in my hat. {n}!",
  "Quack quack! {n}, quick!"
 ],
 "squirrel": [
  "Fish bread instead of acorns! {n}, please~",
  "Saving {n} for winter snacks!",
  "Stuffing them in my cheeks. {n}!",
  "Even my tail is cold. {n}, please~",
  "Smelled them from up the tree. {n}!"
 ]
};
const EN_SPECIALS = {
 "courier": {
  "name": "Courier",
  "lines": [
   "Three more deliveries! {n}, fast!",
   "{n}, please! My truck's double-parked!",
   "The elevator's broken, I took the stairs… {n}, quick!",
   "A hundred parcels today! {n}, please!",
   "{n}! Hurry and I'll tip!"
  ],
  "thanks": "Thanks to you I won't be late! Thank you!"
 },
 "principal": {
  "name": "Kindergarten Principal",
  "lines": [
   "{n} for the children's snack, please~",
   "{n} for my whole class today~",
   "Plenty for the teachers too — {n}~",
   "{n}, please~ The children can't wait!",
   "Take your time. {n}, please~"
  ],
  "thanks": "The children will love these! Here's a thank-you for the big order~"
 },
 "grandpa": {
  "name": "Grandpa Next Door",
  "lines": [
   "{n}, please. I'll be coming by often."
  ],
  "usual": [
   "The usual, please.",
   "Heh, the usual.",
   "You know my usual, don't you?"
  ],
  "thanks": "Heh, you remembered!"
 },
 "girl": {
  "name": "Schoolkid",
  "lines": [
   "I only have ₩500… just {n}, please…",
   "Not enough pocket money… could I get {n} for ₩500?",
   "I snuck out without Mom. {n} for ₩500!"
  ],
  "thanks": "Thank you! I'll tell everyone this place is so kind!"
 },
 "boy": {
  "name": "Schoolkid",
  "lines": [
   "{n}, please! I'm late for cram school!",
   "{n}! I'm sharing with my friend!",
   "Just came from soccer. {n}, please!"
  ]
 },
 "auntie": {
  "name": "Yuni's Mom",
  "lines": [
   "I'm a regular — {n}, a little cheaper? Yuni loves them~",
   "{n}, cheap please~ It's Yuni's snack!",
   "Yuni eats these after cram school. {n}, a discount?~",
   "{n} for Yuni's friends too today~ Cheap, please!",
   "Yuni says yours are the best. {n}, with a discount~"
  ],
  "thanks": "That's how you treat a regular! I'll spread the word~"
 },
 "yuni": {
  "name": "Yuni",
  "lines": [
   "Hungry… I had school lunch and I'm hungry again. {n}.",
   "Mom says yours are the best. {n}, please.",
   "{n} before cram school.",
   "{n} for my friends too. Thank you!",
   "{n}, please. I'll brag to Mom."
  ],
  "thanks": "Mom praised you so much!"
 },
 "hyun": {
  "name": "Hyun on leave",
  "lines": [
   "Home on leave! {n}, please!",
   "This is what I missed most in the army. {n}!",
   "I'm Yuni's big brother. Mom told me to stop by. {n}!",
   "{n} to go for my buddies before I head back!",
   "My leave is short… {n}, quickly please!"
  ],
  "thanks": "Salute! I'll miss this taste back on base!"
 },
 "beggar": {
  "name": "Hungry Wanderer",
  "lines": [
   "I haven't eaten in days… could you spare {n}?",
   "I have no money… but could you share {n}?",
   "I'll repay you someday… just {n}, please.",
   "Just the smell makes me happy… {n}?",
   "It's so cold… could I have {n}?"
  ],
  "leaveLine": "…I'm so hungry. I'll just go.",
  "thanks": "Thank you… you'll be blessed."
 },
 "landlord": {
  "name": "Landlord",
  "lines": [
   "See that building? Mine. The one next to it too~",
   "Half this alley is my land. Heh, business good?",
   "Bought another building yesterday. I was bored~",
   "Fish bread? I don't eat it. But I like seeing you work hard~",
   "That red car's mine. The cheapest of my three~"
  ],
  "thanks": "Here's some pocket money! Keep it up~ Hahaha!"
 },
 "tourist": {
  "name": "Tourist",
  "lines": [
   "Hello! {n}, please! Korea is the best!",
   "Wow, fish bread! {n} please~",
   "I saw it on YouTube! {n}, please!",
   "{n}, please! Can I take a photo?",
   "Excuse me~ {n}! So cute!"
  ],
  "thanks": "Delicious! Really, really good! 👍"
 },
 "couple": {
  "name": "Lovey-Dovey Couple",
  "lines": [
   "Babe, what do you want? {n} for us~",
   "It's our 100th day! {n}, please~",
   "My honey loves fish bread. {n}!",
   "We'll share one each~ {n}!",
   "Are your hands cold, babe? {n}, quick~"
  ],
  "wrongLine": "Huh… we didn't order that?",
  "thanks": "This is totally our date spot!"
 },
 "dad": {
  "name": "Yuni's Dad",
  "lines": [
   "My code worked on the first try! {n} to celebrate!",
   "Red bean or custard, all delicious! Bug-free {n}~",
   "Take your time~ I'll pause time for a bit. {n}!",
   "Here's a secret… I'm actually the developer of this game~ {n}, please!",
   "The world is beautiful! No worries — {n}, please~"
  ],
  "leaveLine": "…I can live with bugs, but not this! See you next time.",
  "thanks": "Perfect! Have a great day, everyone~"
 },
 "santa": {
  "name": "Santa Claus",
  "lines": [
   "Ho ho ho! {n} as gifts for the good children!",
   "Fish bread for my sleigh — {n}, please!",
   "Rudolph is waiting. {n}, please!",
   "This year's last gift is fish bread! {n}!",
   "Children all over the world are waiting! {n}, please!"
  ],
  "leaveLine": "Ho ho… no gifts this year, I'm afraid…",
  "thanks": "Ho ho ho! The best gift this year! Here's mine for you!"
 }
};
