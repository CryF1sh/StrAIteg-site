import re
ATTRS = ('placeholder', 'aria-label', 'alt', 'title', 'content')
BLOCK = re.compile(r'<(script|style)\b[^>]*>.*?</\1>', re.S | re.I)
TOK = re.compile(r'(<!--.*?-->|<[^>]+>)|([^<]+)', re.S)
CYR = re.compile('[А-Яа-яЁё]')
def protect(s):
    blocks = []
    def keep(m): blocks.append(m.group(0)); return '\x00%d\x00' % (len(blocks) - 1)
    return BLOCK.sub(keep, s), blocks
def restore(s, blocks): return re.sub('\x00(\\d+)\x00', lambda m: blocks[int(m.group(1))], s)
def segments(s):
    s, _ = protect(s); out = []
    for m in TOK.finditer(s):
        tag, text = m.group(1), m.group(2)
        if tag:
            if tag.startswith('<!--'): continue
            for a in ATTRS:
                for v in re.findall(r'\b%s="([^"]*)"' % a, tag):
                    if CYR.search(v): out.append(v)
        else:
            t = text.strip()
            if CYR.search(t): out.append(t)
    return out
def translate(s, T, missing):
    s, blocks = protect(s); res = []
    for m in TOK.finditer(s):
        tag, text = m.group(1), m.group(2)
        if tag:
            if not tag.startswith('<!--'):
                def rep(mm):
                    v = mm.group(2)
                    if CYR.search(v):
                        if v in T: v = T[v]
                        else: missing.add(v)
                    return '%s="%s"' % (mm.group(1), v)
                tag = re.sub(r'\b(%s)="([^"]*)"' % '|'.join(ATTRS), rep, tag)
            res.append(tag)
        else:
            t = text.strip()
            if CYR.search(t):
                if t in T: text = text.replace(t, T[t])
                else: missing.add(t)
            res.append(text)
    return restore(''.join(res), blocks)
