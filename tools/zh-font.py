#!/usr/bin/env python3
"""중국어(简体) 글꼴 서브셋 만들기 — 게임에 나오는 한자만 남긴다.

중국어 문장(i18n.js의 ZH 사전·ZH_LINES·ZH_SPECIALS, game.js·story.js의 pick3)을 고치거나 더하면
새 한자가 글꼴에 없을 수 있으니 이 스크립트를 다시 돌린다 (저장소 맨 위에서 실행).

  pip install "fonttools[woff]" brotli
  mkdir -p /tmp/zhsrc && (cd /tmp/zhsrc && npm pack @fontsource/zcool-kuaile @fontsource/noto-sans-sc \
    && for t in *.tgz; do mkdir -p "${t%.tgz}" && tar xzf "$t" -C "${t%.tgz}"; done)
  python3 tools/zh-font.py /tmp/zhsrc

만드는 파일: fonts/ZCOOLKuaiLe-zh.woff2 (게임 글자), fonts/NotoSansSC-zh.woff2 (긴 글),
fonts/ZCOOLKuaiLe-mark.woff2 (언어 스위치의 "中" 한 글자). fontsource는 글꼴을 조각(woff2 여러 개)으로
나눠 두므로, 필요한 글자가 든 조각만 서브셋한 뒤 하나로 합친다.
"""
import glob
import os
import sys

from fontTools import subset
from fontTools.merge import Merger, Options
from fontTools.ttLib import TTFont

SRC = sys.argv[1] if len(sys.argv) > 1 else '/tmp/zhsrc'
FILES = ['i18n.js', 'game.js', 'story.js', 'index.html', 'version.js']
DROP = ['GSUB', 'GPOS', 'GDEF', 'vhea', 'vmtx', 'VORG', 'DSIG']


def is_zh(c):
    o = ord(c)
    return 0x4E00 <= o <= 0x9FFF or 0x3000 <= o <= 0x303F or 0xFF00 <= o <= 0xFFEF


def build(pattern, out, chars):
    parts = []
    tmp = out + '.parts'
    os.makedirs(tmp, exist_ok=True)
    for f in sorted(glob.glob(os.path.join(SRC, pattern))):
        t = TTFont(f)
        cm = t.getBestCmap()
        uni = [ord(c) for c in chars if ord(c) in cm]
        if not uni:
            continue
        o = subset.Options()
        o.layout_features = []
        o.hinting = False
        o.drop_tables += DROP
        s = subset.Subsetter(o)
        s.populate(unicodes=uni)
        s.subset(t)
        t.flavor = None
        p = os.path.join(tmp, f'{len(parts)}.ttf')
        t.save(p)
        parts.append(p)
    if not parts:
        sys.exit(f'글꼴 조각을 찾지 못함: {pattern}')
    font = parts[0] if len(parts) == 1 else None
    font = TTFont(parts[0]) if font else Merger(options=Options(drop_tables=DROP)).merge(parts)
    font.flavor = 'woff2'
    font.save(out)
    for p in parts:
        os.remove(p)
    os.rmdir(tmp)
    cov = TTFont(out).getBestCmap()
    missing = [c for c in chars if ord(c) not in cov]
    print(f'{out}: {os.path.getsize(out):,} bytes, {len(chars) - len(missing)}/{len(chars)}자'
          + (f', 없는 글자: {"".join(missing)}' if missing else ''))


text = ''.join(open(f, encoding='utf-8').read() for f in FILES)
chars = sorted(set(c for c in text if is_zh(c)) | {'中'})
build('fontsource-zcool-kuaile-*/package/files/zcool-kuaile-*-400-normal.woff2', 'fonts/ZCOOLKuaiLe-zh.woff2', chars)
build('fontsource-noto-sans-sc-*/package/files/noto-sans-sc-*-400-normal.woff2', 'fonts/NotoSansSC-zh.woff2', chars)
build('fontsource-zcool-kuaile-*/package/files/zcool-kuaile-*-400-normal.woff2', 'fonts/ZCOOLKuaiLe-mark.woff2', ['中'])
