# Council briefing

`HGSE-Council-Briefing.pdf` — 5-page printable briefing on how HGSE governance works
and which lever each campaign promise pulls. Also published as a private web page.

Sources: `council-playbook.html` (screen) and `council-playbook-print.html` (adds print CSS).

Regenerate:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --no-pdf-header-footer --virtual-time-budget=15000 \
  --print-to-pdf="HGSE-Council-Briefing.pdf" council-playbook-print.html
```
