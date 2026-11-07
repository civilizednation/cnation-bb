# cnation 게임 폰트 — Dongle (동글)

cnation 붕어빵 타이쿤(`cnation-bb`)에 적용한 게임 전용 폰트입니다. 둥글고 귀여운 손글씨체라 2D 캐릭터 게임에 잘 어울립니다.
다른 cnation 게임에 같은 폰트를 쓰려면 이 문서를 첨부하고 "이대로 적용해줘"라고 요청하면 됩니다.

## 0. 빠른 적용 — 이미 만들어둔 파일을 그대로 받기

`cnation-bb` 저장소의 `fonts/` 폴더에 최적화(서브셋)된 파일이 있습니다.

```bash
mkdir -p fonts
for w in Regular Bold; do
  curl -sS -o fonts/Dongle-$w.woff2 \
    "https://raw.githubusercontent.com/civilizednation/cnation-bb/main/fonts/Dongle-$w.woff2"
done
curl -sS -o fonts/OFL-Dongle.txt "https://raw.githubusercontent.com/civilizednation/cnation-bb/main/fonts/OFL-Dongle.txt"
```

| 파일명 | 굵기 | 용량 |
|---|---|---|
| `Dongle-Regular.woff2` | 본문 · 400 | 약 179KB |
| `Dongle-Bold.woff2` | 제목·강조·버튼·숫자 · 700 | 약 181KB |

받은 뒤 **3장의 코드**를 붙이면 됩니다. **3장의 `size-adjust`와 `ascent/descent-override` 값은 빼면 안 됩니다.** Dongle은 그대로 쓰면 글자가 작고 줄 간격이 지나치게 넓습니다(2장 참고).

## 1. 폰트 정보

| 항목 | 내용 |
|---|---|
| 폰트명 | Dongle |
| 배포처 | Google Fonts |
| 라이선스 | SIL Open Font License 1.1 (OFL) — 상업적 사용·수정·재배포 가능. `fonts/OFL-Dongle.txt`를 함께 둡니다 |
| 원저작자 | The Dongle Project Authors (yangheeryu/Dongle) |
| 원본 | `https://github.com/google/fonts` 저장소의 `ofl/dongle/` 폴더 (굵기당 약 4.4MB) |

**적용 규칙**: 두 굵기만 씁니다. 본문·설명글·대사는 Regular(400), 제목·버튼·숫자·강조는 Bold(700). CSS에 800·900 같은 굵기를 쓰면 700으로 그려지니 쓰지 않습니다. 강조는 굵기 대신 크기·색·외곽선으로 줍니다.

## 2. Dongle에 꼭 필요한 보정 (이 폰트만의 특징)

측정값은 모두 글자 크기 1em 기준입니다.

| 문제 | 측정값 | 보정 |
|---|---|---|
| 글자가 작게 그려짐 | 한글 높이 0.61em (일반 한글 글꼴은 약 0.89em) | `size-adjust: 145%`. 다른 글꼴과 같은 글자 높이가 되고, CSS의 `font-size` 값을 하나하나 고칠 필요가 없습니다 |
| 줄 간격이 지나치게 넓음 | 기본 줄 높이 1.45em (위 0.85 + 아래 0.598) | `ascent-override: 54.2%`, `descent-override: 28.6%`. 최종 줄 높이가 1.2em이 되고, 한글이 줄 가운데에 옵니다 |
| 숫자 폭이 제각각 | "1"만 좁음 (0.28em, 다른 숫자 0.33~0.35em) | 시간·점수에 `font-variant-numeric: tabular-nums`. 폰트에 `tnum` 기능이 있으니 서브셋할 때 `--layout-features='*'`로 남깁니다 |

**주의:** `ascent/descent-override` 값은 `size-adjust`만큼 함께 커집니다. 그래서 원하는 값(줄 높이 1.2em에서 한글이 가운데에 오는 위 0.786em, 아래 0.414em)을 145%로 나눠서 넣었습니다. `size-adjust`를 바꾸면 이 두 값도 다시 계산해야 합니다.

```
줄 높이 T = 1.2, 크기 보정 s = 1.45, 글자 중심 c = 0.128 (게임 속 한글의 위·아래 끝 중앙값 기준)
ascent-override  = (T / s / 2 + c) × 100%  = 54.2%
descent-override = (T / s / 2 − c) × 100%  = 28.6%
```

## 3. 적용 코드

```html
<!-- <head> 안, 가능한 위쪽 -->
<link rel="preload" href="fonts/Dongle-Regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/Dongle-Bold.woff2" as="font" type="font/woff2" crossorigin>
```

```css
@font-face {
  font-family: 'Dongle';
  src: url('fonts/Dongle-Regular.woff2') format('woff2');
  font-weight: 400; font-style: normal; font-display: swap;
  size-adjust: 145%;
  ascent-override: 54.2%; descent-override: 28.6%; line-gap-override: 0%;
}
@font-face {
  font-family: 'Dongle';
  src: url('fonts/Dongle-Bold.woff2') format('woff2');
  font-weight: 700; font-style: normal; font-display: swap;
  size-adjust: 145%;
  ascent-override: 54.2%; descent-override: 28.6%; line-gap-override: 0%;
}
body {
  font-family: 'Dongle', -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif;
  font-weight: 400;
}
h1, h2, h3, button, .btn { font-weight: 700; }
```

게임에 로딩 화면이 있다면, 로딩이 끝나기 전에 폰트도 받아 둡니다. 그러면 기본 글꼴로 그려졌다가 바뀌는 현상이 없습니다.

```js
await Promise.all([400, 700].map((w) => document.fonts.load(`${w} 16px Dongle`, '붕어빵')));
```

## 3-1. 긴 글은 IBM Plex Sans KR 400과 함께 쓰기

Dongle은 짧은 글에는 귀엽지만, 게임 방법이나 업데이트 기록처럼 긴 글은 읽기 힘듭니다. 그래서 긴 글에만 cnation 폰트 조합 #1의 **IBM Plex Sans KR Regular(400)**를 씁니다.

- 파일: `fonts/IBMPlexSansKR-Regular.woff2` (같은 글자 범위로 서브셋, 2.8MB → 517KB), 라이선스 `fonts/OFL-IBMPlexSansKR.txt`
- Plex는 보정 없이 그대로 씁니다. 크기는 **13.5px**, 줄 높이 1.55~1.6, 글자 간격 -0.2px입니다. 360×640 화면 기준으로 13px는 빽빽하고, 14px부터 3줄로 넘어가는 항목이 생깁니다.
- 굵기는 400 하나만 받으므로, 긴 글 안의 강조(`<b>`)는 굵기 대신 색으로 표시합니다.
- 로딩 화면이 끝난 뒤 뒤에서 받습니다. 긴 글은 메뉴를 눌러야 열리므로, 처음 로딩 시간을 늘리지 않습니다.

```css
@font-face {
  font-family: 'IBM Plex Sans KR';
  src: url('fonts/IBMPlexSansKR-Regular.woff2') format('woff2');
  font-weight: 400; font-style: normal; font-display: swap;
}
:root { --font-text: 'IBM Plex Sans KR', -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif; }
.long-text { font-family: var(--font-text); font-size: 13.5px; font-weight: 400; line-height: 1.55; letter-spacing: -0.2px; }
.long-text b { font-weight: 400; color: #c8560f; }
```

## 4. 서브셋 직접 만들기 (문자 범위를 바꿀 때만)

```bash
pip install "fonttools[woff]" brotli
for w in Regular Bold; do
  curl -sS -o Dongle-$w.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/dongle/Dongle-$w.ttf"
done
UNICODES="U+0020-007E,U+00A0,U+AC00-D7A3,U+00B7,U+00D7,U+2013-2014,U+2018-2019,U+201C-201D,U+2022,U+2026,U+203A,U+2190,U+2192,U+2194,U+2302,U+20A9"
for w in Regular Bold; do
  python3 -m fontTools.subset Dongle-$w.ttf --unicodes="$UNICODES" --flavor=woff2 \
    --output-file=fonts/Dongle-$w.woff2 --layout-features='*' --drop-tables+=DSIG
done
```

문자 범위는 cnation 폰트 조합 #1(IBM Plex Sans KR)과 같습니다. 영어 화면(v1.6.0)의 원화 기호 `₩`(U+20A9)는 나중에 더했습니다: 저장소의 세 woff2에는 같은 글꼴의 latin-ext 조각(@fontsource/dongle, @fontsource/ibm-plex-sans-kr)에서 그 글자 하나만 옮겨 넣었습니다. 한글 완성형 11,172자를 모두 넣어서, 앞으로 어떤 한글이 추가돼도 다시 만들 필요가 없습니다. 이모지는 넣지 않습니다(기기의 이모지 글꼴로 나옵니다).

| 파일 | 원본 | 서브셋 후 | 절감률 |
|---|---|---|---|
| Regular (400) | 4.46MB | **179KB** | 약 96% ↓ |
| Bold (700) | 4.48MB | **181KB** | 약 96% ↓ |
| **합계** | 8.9MB | **약 360KB** | |
