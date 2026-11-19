"""फ्रैगमेंट से पूरा टूल पेज बनाता है: python3 tools/_wrap.py frag1.html frag2.html ..."""
import sys, json, os, re
TPL = '''<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} | Astro Vikass</title>
<meta name="theme-color" content="#6b1418">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Yatra+One&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="lib/ui.css">
{css}</head>
<body>
<header class="av-head"><div class="ic">{icon}</div><h1>{title}</h1><p>{sub}</p><span class="brand">ASTRO VIKASS</span></header>
<main class="av-wrap">
{body}
</main>
<div class="foot"><b>Astro Vikass</b> • ☎ 7069492135<br>ज्योतिषीय गणना मार्गदर्शन हेतु है</div>
<script src="lib/places.js"></script>
<script src="lib/astro.js"></script>
<script src="lib/ui.js"></script>
{libs}<script>
{script}
</script>
</body>
</html>
'''
here = os.path.dirname(os.path.abspath(__file__))
for f in sys.argv[1:]:
    s = open(f).read()
    m = re.match(r'<!--meta (\{.*?\}) -->\n', s)
    meta = json.loads(m.group(1)); s = s[m.end():]
    css = ''
    if '<!--css-->' in s:
        a, s = s.split('<!--css-->', 1)
        css_part, s = s.split('<!--body-->', 1)
        css = '<style>' + css_part.strip() + '</style>\n'
    body, script = s.split('<!--script-->', 1)
    libs = ''.join('<script src="lib/%s.js"></script>\n' % l for l in meta.get('libs', []))
    out = TPL.format(title=meta['title'], icon=meta['icon'], sub=meta['sub'], css=css, body=body.strip(), script=script.strip(), libs=libs)
    open(os.path.join(here, meta['id'] + '.html'), 'w').write(out)
    print('built', meta['id'])
