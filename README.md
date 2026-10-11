# XUX Studio — website

One-page site for XUX Studio (working name): human-factors and interface design for space and extreme environments, Styria, Austria.

## Publish on GitHub Pages
1. Create a public repository on GitHub, e.g. `xux-studio`.
2. Upload `index.html` and `.nojekyll` to the repository root.
3. Settings → Pages → Source: "Deploy from a branch" → `main` / `(root)` → Save.
4. After about a minute the site is live at `https://<your-username>.github.io/xux-studio/`.

## Change the name later
The name appears in the `<title>`, the header logo, the hero tag, and the footer. Search the file for `XUX` and replace.

## Pages
- `index.html` — the one-page site.
- `work-system.html` — 4-slide partner briefing (XUX focus, launch timeline, how we work, next step). Arrow keys / space / swipe to navigate, `F` for fullscreen, `#3` in the URL opens slide 3.

## Contact card
The QR code and "Save contact (.vcf)" on both pages come from `assets/vcard.js`. Edit the `CONTACT` object there.

## Brand status
"XUX" is a temporary working name. Both pages say so on purpose; keep the "brand under construction" notes until the final name is chosen.

## Works offline
Nothing loads from outside the repo: fonts (`assets/fonts/`, SIL Open Font License), three.js r128 + loaders + Draco decoder and the QR library (`assets/vendor/`), and the 3D models (`assets/models/`, public domain, from NASA 3D Resources; credited in each viewer). Safe to present on bad venue wifi.
