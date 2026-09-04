# Amber Bellou for HGSE Student Council

A one-page campaign site with a real backend. Students share concerns and ideas through the form; every response lands in a private Google Sheet, and a passcode-protected dashboard on the site shows totals, topics, and every message.

- `index.html` – the public page (about, priorities, and the form)
- `results.html` – private dashboard (needs the passcode)
- `backend/Code.gs` – Google Apps Script that stores and serves responses
- `config.js` – the one line you edit to connect the backend
- `flags/` – 248 country flags (ISO 3166 list, Israel excluded)

## 1. Put it on GitHub Pages

```bash
cd "amber-for-hgse"
gh repo create amber-for-hgse --public --source=. --push
gh api -X POST repos/amberbellou/amber-for-hgse/pages -f build_type=legacy -f "source[branch]=main" -f "source[path]=/"
```

The site will be live in a minute or two at `https://amberbellou.github.io/amber-for-hgse/`.
(Or do it by hand: create the repo, push, then Settings -> Pages -> Branch: main, folder: / root.)

## 2. Connect the backend (5 minutes)

1. Create a new Google Sheet (any name, for example "HGSE responses").
2. In the sheet: **Extensions -> Apps Script**. Delete the sample code and paste the whole of `backend/Code.gs`.
3. Set your passcode: click the gear (**Project Settings**) -> **Script Properties** -> **Add script property**. Name: `ADMIN_KEY`. Value: a passcode only you know. Save.
4. **Deploy -> New deployment**. Type: **Web app**. Execute as: **Me**. Who has access: **Anyone**. Click Deploy and authorize when Google asks.
5. Copy the **Web app URL** (it ends in `/exec`). Open `config.js` and paste it:

```js
window.SITE_CONFIG = { endpoint: "https://script.google.com/macros/s/....../exec" };
```

6. Commit and push. Done. Submissions now appear as rows in your sheet, and `results.html` shows them after you enter the passcode.

Until step 5 is done the site runs in **demo mode**: the form still works, but responses are stored only in that visitor's browser, and the dashboard only shows what was submitted from the same browser. Good for previewing, not for the campaign.

### Notes

- The Apps Script URL is fine to be public. The passcode never leaves Google's side: the dashboard sends it to the script, the script compares it to `ADMIN_KEY`, and only then returns rows.
- Never put the passcode itself in this repo.
- If you edit `Code.gs` later, you must publish a new version: **Deploy -> Manage deployments -> pencil icon -> Version: New version -> Deploy**. The URL stays the same.
- A hidden honeypot field drops most spam bots silently.

## Run it locally

```bash
python3 -m http.server 8765
```

Then open http://localhost:8765/.
