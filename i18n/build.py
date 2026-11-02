# Сборка английской версии из русских страниц.
# Запуск из корня репозитория:  python3 i18n/build.py .
# Переводы лежат в i18n/pairs.txt: «русский текст || English text», по одной паре на строку.
# Скрипт пересоздаёт en/index.html, vendors/en/index.html, en/privacy/index.html,
# переключатель языка и hreflang на всех страницах и словарь I18N_EN в assets/site.js.
# Тексты без перевода выводятся списком «missing» — добавьте их в pairs.txt и запустите снова.
import sys, os, re, json
sys.path.insert(0, os.path.dirname(__file__)); from tx import translate, CYR
D = os.path.dirname(__file__); R = sys.argv[1]
T = {}
for line in open(os.path.join(D, 'pairs.txt'), encoding='utf-8').read().split('\n'):
    if ' || ' not in line: continue
    k, v = line.split(' || ', 1)
    if k.endswith(' ') and not v.endswith(' '): v += ' '
    if k.startswith(' ') and not v.startswith(' '): v = ' ' + v
    T[k] = v
F, V = 'https://factory.straitegist.ru', 'https://vendors.straitegist.ru'
PAGES = [  # ru file, en file, ru url, en url
    ('index.html', 'en/index.html', F + '/', F + '/en/'),
    ('vendors/index.html', 'vendors/en/index.html', V + '/', V + '/en/'),
    ('privacy/index.html', 'en/privacy/index.html', F + '/privacy/', F + '/en/privacy/'),
]
missing = set()
def tr_json(o):
    if isinstance(o, dict): return {k: tr_json(v) for k, v in o.items()}
    if isinstance(o, list): return [tr_json(v) for v in o]
    if isinstance(o, str) and CYR.search(o):
        if o in T: return T[o]
        missing.add(o); return o
    return o
def switcher(ru, en, cur):
    a = lambda href, code, label, on: '<a href="%s" hreflang="%s" lang="%s"%s>%s</a>' % (href, code, code, ' aria-current="page"' if on else '', label)
    return '<div class="lang" role="group" aria-label="%s">%s%s</div>' % ('Язык' if cur == 'ru' else 'Language', a(ru, 'ru', 'RU', cur == 'ru'), a(en, 'en', 'EN', cur == 'en'))
def alternates(ru, en):
    return ('<link rel="alternate" hreflang="ru" href="%s">\n<link rel="alternate" hreflang="en" href="%s">\n<link rel="alternate" hreflang="x-default" href="%s">\n' % (ru, en, ru))
def add_lang_ui(s, ru, en, cur):
    s = re.sub(r'<link rel="alternate" hreflang[^>]*>\n', '', s)
    s = re.sub(r'<div class="lang"[^>]*>.*?</div>\n?', '', s)
    s = re.sub(r'<a class="mlang"[^>]*>[^<]*</a>\n?', '', s)
    s = s.replace('<link rel="canonical"', alternates(ru, en) + '<link rel="canonical"', 1)
    if '<a class="login"' in s:
        s = s.replace('<a class="login"', switcher(ru, en, cur) + '\n<a class="login"', 1)
        other = '<a class="mlang" href="%s" lang="%s">%s</a>\n' % ((en, 'en', 'English') if cur == 'ru' else (ru, 'ru', 'Русский'))
        s = re.sub(r'(<div class="menu">\n)', r'\1' + other.replace('\\', '\\\\'), s, count=1)
    else:  # privacy: switcher in the top bar
        s = s.replace('</a></div></header>', '</a>' + switcher(ru, en, cur) + '</div></header>', 1)
    return s
for ru_f, en_f, ru_u, en_u in PAGES:
    p = os.path.join(R, ru_f); s = open(p, encoding='utf-8').read()
    s = add_lang_ui(s, ru_u, en_u, 'ru'); open(p, 'w', encoding='utf-8').write(s)
    e = translate(s, T, missing)
    e = e.replace('<html lang="ru">', '<html lang="en">', 1).replace('content="ru_RU"', 'content="en_US"')
    e = e.replace('<link rel="canonical" href="%s">' % ru_u, '<link rel="canonical" href="%s">' % en_u)
    e = e.replace('<meta property="og:url" content="%s">' % ru_u, '<meta property="og:url" content="%s">' % en_u)
    e = e.replace('href="/privacy/"', 'href="/en/privacy/"')
    e = re.sub(r'href="(https://(?:factory|vendors)\.straitegist\.ru)/"(?! hreflang)', r'href="\1/en/"', e)
    e = re.sub(r'(<a class="logo" href=")[^"]*(")', lambda m: m.group(1) + ('#top' if 'privacy' not in ru_f else F + '/en/') + m.group(2), e)
    def ld(m):
        d = tr_json(json.loads(m.group(1)))
        for n in d.get('@graph', []):
            if n.get('@type') == 'WebSite': n['inLanguage'] = 'en'; n['url'] = en_u; n['@id'] = en_u + '#site'
            if n.get('@type') == 'Service': n['url'] = en_u; n['@id'] = en_u + '#service'
            # Английская версия: цены в долларах (тариф vendors: от $1,290 в месяц)
            if n.get('@type') == 'Service':
                offers = n.get('offers'); offers = offers if isinstance(offers, list) else [offers]
                for o in offers:
                    if not o: continue
                    o['priceCurrency'] = 'USD'
                    ps = o.get('priceSpecification')
                    if ps: ps['priceCurrency'] = 'USD'; ps['minPrice'] = '1290' if ps.get('minPrice') == '99000' else ps.get('minPrice')
            if n.get('@type') == 'FAQPage': n['@id'] = en_u + '#faq'
        return '<script type="application/ld+json">\n' + json.dumps(d, ensure_ascii=False) + '\n</script>'
    e = re.sub(r'<script type="application/ld\+json">\n(.*?)\n</script>', ld, e, flags=re.S)
    e = add_lang_ui(e, ru_u, en_u, 'en')
    os.makedirs(os.path.dirname(os.path.join(R, en_f)), exist_ok=True)
    open(os.path.join(R, en_f), 'w', encoding='utf-8').write(e)
# site.js dictionary
js = os.path.join(R, 'assets/site.js'); s = open(js, encoding='utf-8').read()
body = re.sub(r'  /\* =+ Английская версия: перевод строк скрипта =+ \*/.*?/\* =+ /Английская версия =+ \*/\n', '', s, flags=re.S)
body = re.sub(r'/\*.*?\*/', '', body, flags=re.S); body = re.sub(r'(?m)^\s*//[^\n]*', '', body)
keys = []
for m in re.finditer(r'"((?:[^"\\\n]|\\.)*)"', body):
    if CYR.search(m.group(1)) and m.group(1) not in keys: keys.append(m.group(1))
keys.append('name@company.ru')
dic = {}
for k in keys:
    if k in T: dic[k] = T[k]
    else: missing.add('site.js: ' + k)
block = '  /* ===================== Английская версия: перевод строк скрипта ===================== */\n  var I18N_EN = ' + json.dumps(dic, ensure_ascii=False, indent=0).replace('\n', '\n    ') + ';\n  /* ===================== /Английская версия ===================== */\n'
s = re.sub(r'  /\* =+ Английская версия: перевод строк скрипта =+ \*/.*?/\* =+ /Английская версия =+ \*/\n', '', s, flags=re.S)
s = s.replace('  var AUDIENCE =', block + '  var AUDIENCE =', 1)
open(js, 'w', encoding='utf-8').write(s)
left = sorted(m for m in missing)
print('missing:', len(left)); print('\n'.join(left))
