# WinIsland website

The landing page: plain HTML, CSS and JavaScript, no build step.

```
index.html    the page
styles.css    the look (the sky, the glass, every island view)
island.js     the island: shapes, spring animation and views copied from the app
main.js       the page's demos, navigation island, Siro, waitlist and pricing
favicon.svg
```

## Run it

From this folder:

```bash
python -m http.server 5173
```

Then open http://localhost:5173. (Opening `index.html` directly also works, but the "try the waveform with your voice" button needs `localhost` or `https`.)

## Before going live

- **Waitlist**: set `WAITLIST_ENDPOINT` at the top of `main.js` to a form backend that accepts a JSON `POST` of `{ "email": "…" }` (Formspree, Buttondown, a Cloudflare Worker…). Until then the forms show their thank-you message but **send the email nowhere**.
- **Prices**: the plans in `index.html` (`data-usd` / `data-inr` on each price) are the planned ones; INR is shown by default to visitors in India.
- **Social preview**: add a 1200×630 image and an `og:image` meta tag in `index.html`.

## Deploy

Any static host works: GitHub Pages, Netlify, Cloudflare Pages or Vercel. The site is the root of this repo, so there's nothing to configure.
