# WinIsland website

The landing page: plain HTML, CSS and JavaScript, no build step.

```
config.js     links and the waitlist backend: edit this at launch
index.html    the page
styles.css    the look (the sky, the glass, every island view)
island.js     the island: shapes, spring animation and views copied from the app
main.js       the page's demos, navigation island, Siro, waitlist and pricing
favicon.svg
apps-script/   the Google Sheets waitlist backend (Code.gs) and its setup guide
```

## Run it

From this folder:

```bash
python -m http.server 5173
```

Then open http://localhost:5173. (Opening `index.html` directly also works, but the "try the waveform with your voice" button needs `localhost` or `https`.)

## Settings: `config.js`

Everything you'd change at launch is in [`config.js`](config.js):

- **`downloadUrl`** and **`storeUrl`**: while both are empty the site is in "coming soon" mode. The Download and Microsoft Store buttons show a *Soon* tag and lead to the waitlist. Fill in either one and every button on the page goes live, and the waitlist forms are hidden.
- **`version`** and **`size`**: shown under the download button.
- **`waitlistUrl`**: the Google Apps Script that saves sign-ups to a Google Sheet. Setup takes about 5 minutes; see [`apps-script/README.md`](apps-script/README.md). Until it's set, the forms say thank you but **save the email nowhere**.

Prices are in `index.html` (`data-usd` / `data-inr` on each price). INR is shown by default to visitors in India.

## Deploy

Any static host works: GitHub Pages, Netlify, Cloudflare Pages or Vercel. The site is the root of this repo, so there's nothing to configure.

## License

Copyright © 2026 Suman Rajak. All rights reserved; see [LICENSE](LICENSE). The code is public so the site can be hosted, not for reuse.
