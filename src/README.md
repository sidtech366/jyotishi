# Astro Vikass — मुफ्त लाल किताब कुंडली

जन्म तिथि, समय और स्थान डालते ही पूरी लाल किताब + वैदिक रिपोर्ट। पूरी गणना ब्राउज़र में होती है — कोई सर्वर, API या खर्च नहीं।

**लाइव लिंक:** `https://sidtech366.github.io/jyotishi/`

## क्या-क्या है
- लग्न कुंडली + लाल किताब कुंडली (उत्तर भारतीय शैली)
- ग्रह स्पष्ट, नक्षत्र-चरण, वक्री/अस्त, ग्रह शक्ति, अवस्था
- योग (पंचमहापुरुष, गजकेसरी, बुधादित्य, राजयोग, विपरीत राजयोग, धन योग)
- दोष (मांगलिक, कालसर्प, गुरु-चांडाल, ग्रहण, केमद्रुम), साढ़े साती/ढैय्या की तारीखें
- व्यक्तित्व, करियर, धन, विवाह, संतान, स्वास्थ्य
- 9 ग्रह × 12 भाव = 108 लाल किताब फल और उपाय
- विंशोत्तरी महादशा, अंतर्दशा, अगले 5 वर्षों का वर्षफल
- अंक ज्योतिष (मूलांक, भाग्यांक, नामांक, व्यक्तिगत वर्ष), मंत्र, Do's/Don'ts
- PDF (Print → Save as PDF), WhatsApp शेयर

## गणना
- ग्रह: Schlyter खगोलीय विधि (चंद्र, गुरु, शनि संशोधन सहित)
- अयनांश: लाहिरी • भाव: पूर्ण राशि • दशा: विंशोत्तरी
- जाँच: 22-01-1996, 19:22, बगहा → सिंह लग्न, कुंभ राशि, शतभिषा-1, गुरु महादशा 2014–2030 ✅

## बदलाव कैसे करें
`src/` में फ़ाइलें बदलें, फिर `python3 src/build.py` चलाएं — यह `index.html` (रूट) दोबारा बना देगा।
- `data1.js` — लग्न, राशि, नक्षत्र, करियर, विवाह, दशा, मूलांक के फल
- `data2.js` — लाल किताब 108 फल + उपाय
- `cities.js` — जन्म स्थान सूची (नया शहर एक पंक्ति में जोड़ें)
- `app.js` — रिपोर्ट का ढांचा, योग-दोष नियम, `CONFIG` (साइट नाम, Supabase)
- `template.html` — डिज़ाइन (CSS) और फॉर्म

## Supabase (वैकल्पिक — लीड सेव करने के लिए)
1. supabase.com पर फ्री प्रोजेक्ट बनाएं, SQL Editor में चलाएं:
```sql
create table kundli_leads (id bigint generated always as identity primary key, name text, mobile text, dob date, tob text, place text, lat float, lon float, created_at timestamptz default now());
alter table kundli_leads enable row level security;
create policy "insert" on kundli_leads for insert to anon with check (true);
```
2. `app.js` के `CONFIG` में `SUPABASE_URL` और `SUPABASE_ANON_KEY` भरें, build चलाएं और push करें।
