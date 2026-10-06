# Ank Jyotish: Astrology + Numerology Platform (Phase 1 + 2)

Stack: GitHub Pages (frontend) + Google Apps Script (API) + Google Sheets (database) + Google Drive (files).
Built so far: setup, auth, admin panel, knowledge editor, settings, wallet core, numerology (name, DOB, future years).
Not built yet (next phases): Kundli calculation, rule/yoga/dosha engine, plans purchase, payments, PDFs, JSON import.

## 1. Backend setup (5 minutes)
1. Create a new Google Sheet. Open **Extensions > Apps Script**.
2. Delete the default `Code.gs`. Create files and paste from `apps-script/`: `Core.gs`, `Auth.gs`, `Numerology.gs`, `Admin.gs`, `Setup.gs`.
3. Click **Project Settings** > tick "Show appsscript.json" and paste `apps-script/appsscript.json` over it.
4. Select `setupSystem` in the function dropdown and **Run**. Approve permissions. This creates all 30 tabs, headers, default settings, number mappings, Drive folders and daily triggers.
5. Select `runTests` and **Run**. The log must say `ALL TESTS PASSED` (VIKAS = 13 / 4 / Rahu).
6. Open the **Admins** sheet. In row `ADMIN001` type your **Mobile** (10 digits) and **Password**. Never put these in code or GitHub.

## 2. Deploy the API
**Deploy > New deployment > Web app**: Execute as **Me**, Who has access **Anyone**. Copy the Web app URL (ends in `/exec`).
After any later code change: **Deploy > Manage deployments > Edit > New version**.

## 3. Frontend on GitHub Pages
1. Edit `js/config.js` and paste the Web app URL (it is public; it holds no secrets).
2. Push all files except `apps-script/` and this README's secrets (there are none) to a GitHub repo.
3. Repo **Settings > Pages > Deploy from branch > main / root**.
4. Open `https://<you>.github.io/<repo>/admin-login.html` and log in with the Admins sheet mobile/password.

## 4. Daily use
- Rebrand, switches, pricing text: **Admin > Settings** (instant).
- Meanings for name/Mulank/Bhagyank: **Knowledge > Numerology meanings** (NumberType = NAME, MULANK or BHAGYANK; Number = 1-9).
- Future-year cautions: **Knowledge > Future year warnings**. NumberType = NAME / MULANK / BHAGYANK / PERSONAL_YEAR, Number = the user's number, YearNumber = year root (blank = any year), RemedyIDs = comma list from Remedies. Only rows that exist are shown; nothing is invented.
- Change letter values or planets: **Knowledge > Alphabet and planet mapping**.
- Change admin password: **Admin > Admins > Edit**, or type it directly in the Admins sheet.
- Roles: SUPER_ADMIN everything; ADMIN no admin management; EDITOR knowledge only; SUPPORT users only.

## 5. Why it is fast
Config sheets are cached in CacheService and busted on save; single-row lookups use TextFinder (no full scans); writes are one call per record; the frontend shows cached public data instantly then refreshes; no frameworks, no web fonts; name preview runs in the browser.

## 6. Security notes
Passwords for users: salted, iterated HMAC-SHA256. Admin password lives in the private Admins sheet by your requirement; keep the Sheet unshared. Sessions are random tokens (only hashes stored), 5 failed logins lock a mobile for 10 minutes, every admin write is audit-logged, premium rows are withheld server-side.

## 7. Test checklist (Phase 1-2)
Register; duplicate mobile; duplicate email; login; logout; wrong login shows "Invalid mobile number or password"; admin login; wrong admin login; numerology VIKAS = 13 / 4 / Rahu; DOB 14-08-1996 gives Mulank 14/5, Bhagyank 38/2; add a YearWarning (Name, 4, YearNumber 4) and check year 2029 shows it; with no rule you see "No configured interpretation is available for this combination."; add/deduct points with reason; deactivate a rule; change a setting.

## 8. Known limits
Apps Script has ~1s cold starts and quotas; Sheets is fine for thousands of users, not millions. Keep `api.js` as the only place that knows the backend, so you can move to Supabase later.
