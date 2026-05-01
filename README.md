# Instagram Handoff Debug Suite

## iPhone Instagram test flow
1. Deploy to Vercel.
2. Send your `/open` URL to yourself in an Instagram DM.
3. Tap the link inside Instagram.
4. Wait 3 seconds without touching anything.
5. If still on `/open`, screenshot `/open`.
6. Tap each manual button and screenshot each `/final` result.
7. Compare `method` query param shown on `/final`.

## Result interpretation
- `auto-*` reached `/final`: automatic attempt executed and succeeded.
- Stayed on `/open` with failure banner: automatic attempts likely blocked/ignored.
- `tap`/`button` reached `/final`: user gesture path likely allowed.
- `method=manual-unknown`: likely manual "Open in browser" or params dropped.
- `uaIg=true` at `/final`: likely still in Instagram webview.
- `uaIg=false` at `/final`: likely external browser.

## What to capture for diagnosis
- Screenshot of `/open` after waiting 3 seconds.
- Screenshot of `/final` for each button path.
- Downloaded debug JSON from `/open` and `/final`.
