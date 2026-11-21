import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
js = "\n".join(open(f).read() for f in ["engine.js","data1.js","data2.js","cities.js","dosh.js","app.js"])
html = open("template.html").read().replace("/*__SCRIPTS__*/", js)
open("../index.html","w").write(html)
print(len(html))
