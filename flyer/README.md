# Campaign flyer

- `Amber-Bellou-HGSE-flyer.pdf` — US Letter (8.5x11), print this.
- `Amber-Bellou-HGSE-whatsapp.png` — 1080x1350, send this in WhatsApp/text chats.
- `Amber-Bellou-HGSE-story.png` — 1080x1920, post this as an Instagram Story or WhatsApp Status.
- `qr.png` — the QR code alone, scans to https://amberbellou.github.io/amber-for-hgse/ (verified).

Sources: `flyer-print.html`, `flyer-social.html`, `flyer-story.html`. To regenerate after editing:

```bash
cd flyer
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --no-pdf-header-footer --virtual-time-budget=12000 \
  --print-to-pdf="Amber-Bellou-HGSE-flyer.pdf" flyer-print.html

"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --hide-scrollbars --virtual-time-budget=12000 --window-size=1080,1350 \
  --screenshot="Amber-Bellou-HGSE-whatsapp.png" flyer-social.html
```
