# FOLD website (foldgame.app)

The public website for **FOLD: Lumi's Paper World**. Plain HTML, CSS and a little vanilla
JavaScript. There is no build step, no framework, no Node, no cookies, no analytics and no
third-party fonts or scripts. Whatever is in this folder is exactly what gets published.

```
website/
  index.html            landing page
  privacy/index.html    privacy policy   → https://foldgame.app/privacy/   (Apple requires this URL)
  support/index.html    FAQ and contact  → https://foldgame.app/support/   (Apple requires this URL)
  press/index.html      press kit
  credits/index.html    credits and music attributions
  404.html              "page not found" (GitHub Pages serves it automatically)
  assets/css/site.css   all styles (light and dark theme, responsive, reduced motion)
  assets/js/site.js     fold demo in the hero, gallery buttons, scroll reveal
  assets/img/           app icon, favicons, Open Graph image
  assets/screens/       screenshot slots 01.png … 06.png
  CNAME                 custom domain for GitHub Pages (foldgame.app)
  publish.sh            sends this folder to GitHub Pages (not published itself)
  .nojekyll             tells GitHub Pages to publish the files as they are
  robots.txt, sitemap.xml, favicon.ico
```

## Preview locally

```bash
python3 -m http.server 8000
```

Run it inside this folder, then open <http://localhost:8000/>. Python's simple server does not
show the custom 404 page for missing addresses; GitHub Pages does. Open
<http://localhost:8000/404.html> to see it.

## What you still have to supply

Nothing below blocks the site from loading, but every item is visible to visitors or to Apple
until it is replaced.

### 1. Name, contact address and App Store ID

| What | Where it appears | Status |
|---|---|---|
| Developer name | `privacy/index.html` ("made and published by"), `press/index.html` (fact sheet), `credits/index.html`, and the `author` field of the structured data in `index.html` | Filled in: **Sadra Makhmali**. It should match the seller name shown on the App Store. |
| Contact address | the footer "Contact" link on all six pages, plus two visible email links each in `privacy/`, `support/` and `press/` (18 occurrences) | Filled in: `sadramakhmali.sm@gmail.com`. Every `mailto:` link also sets the subject to "FOLD", which makes the messages easy to filter. |
| `APP_STORE_ID` | `index.html`, inside a commented-out `<meta name="apple-itunes-app">` | **Still a placeholder.** Use the numeric Apple ID of the app (App Store Connect → App Information), then remove the comment markers around that line to turn on the Safari Smart App Banner. |

The contact address is a personal Gmail address and is public on the site. To switch to an address
on the domain later (for example `support@foldgame.app`), replace it everywhere in one go (macOS):

```bash
grep -rl 'sadramakhmali.sm@gmail.com' --include='*.html' . | xargs sed -i '' 's/sadramakhmali\.sm@gmail\.com/support@foldgame.app/g'
```

GitHub Pages does not provide email. An address on `foldgame.app` needs mail hosting or email
forwarding for the domain, set up separately (MX records). That does not conflict with the DNS
records used for the website below.

### 2. Images

| File | Size | Status now | What to supply |
|---|---|---|---|
| `assets/screens/01.png` | iPhone screenshot, portrait | labelled placeholder | **Fold**: a level being folded (The Forgotten Garden). |
| `assets/screens/02.png` | same | labelled placeholder | **Match**: lights meeting after a fold. |
| `assets/screens/03.png` | same | labelled placeholder | **Bloom**: the origami reveal after a solved level. |
| `assets/screens/04.png` | same | labelled placeholder | **Rebuild**: the 3D world with restored landmarks. |
| `assets/screens/05.png` | same | labelled placeholder | **Remember**: the realm map or the Memory Atlas. |
| `assets/screens/06.png` | same | labelled placeholder | **Wander**: Endless Weave or Daily Discovery. |
| `assets/img/app-icon.png` | 1024 × 1024 | copy of `FOLD/Assets.xcassets/AppIcon.appiconset/AppIcon.png` taken on 2026-11-18 | Replace if the icon changes. |
| `assets/img/apple-touch-icon.png` | 180 × 180 | made from the same icon | Regenerate if the icon changes. |
| `assets/img/favicon-192.png`, `favicon.ico` | 192 × 192, 32 × 32 | made from the same icon | Regenerate if the icon changes. |
| `assets/img/og-image.png` | 1200 × 630 | generated share image (crane, title, tagline) | Optional: replace with final key art. Keep the size. |

Screenshots: keep the file names and use PNG. Any current iPhone portrait size works (for example
1206 × 2622 or 1320 × 2868); the page crops to the same shape. The `alt` text and captions in
`index.html` and `press/index.html` describe the scenes listed above, so keep that order or edit
the text to match. Raw simulator screenshots are fine; do not add a device frame, the page draws
rounded corners itself.

Regenerate the small icons after replacing `app-icon.png`:

```bash
sips -Z 180 assets/img/app-icon.png --out assets/img/apple-touch-icon.png
```

```bash
sips -Z 192 assets/img/app-icon.png --out assets/img/favicon-192.png
```

(`favicon.ico` is a 32 × 32 PNG wrapped as an ICO. Any favicon generator can remake it, or leave it.)

### 3. Things to change on launch day

| What | Where | Change to |
|---|---|---|
| App Store badge | `index.html`, two blocks marked `APP STORE BADGE SLOT` (hero and bottom of the page) | See "App Store badge" below. |
| App Store link in the fact sheet | `press/index.html`, marked `APP STORE LINK SLOT` | Set `href` to the App Store URL and the text to "Download on the App Store". |
| "Coming soon to the App Store" heading and the line under it | `index.html`, section `id="download"` | For example "Get FOLD on the App Store". |
| Release date "To be announced" | `press/index.html` fact sheet | The release date. |
| Smart App Banner | `index.html` `<head>` | See `APP_STORE_ID` above. |
| Privacy policy effective date | `privacy/index.html`, `<time datetime="2026-11-18">18 November 2026</time>` | The date you publish, and again whenever the policy changes. |
| `lastmod` dates | `sitemap.xml` | The date of the last change. |

### 4. Music credits

`credits/index.html` has an empty table (Track, Composer, Licence, Link) with one placeholder
row, "Music credits will be listed here." A commented template row sits just above the table:
copy it once per track and delete the placeholder row.

### 5. Facts to confirm against the shipped app

The pages state these as facts. Please check them against the final build:

* **iCloud.** The privacy policy and the support page say progress is saved on the device and,
  when iCloud is on for FOLD, may also be kept in the player's own iCloud and restored from it.
  If the released app does not sync to iCloud, edit the "iCloud" section of `privacy/index.html`
  and the "Saving and restoring progress" answers in `support/index.html` (device backups still
  restore progress either way).
* **Age rating.** Not stated anywhere on the site. Add it to the press fact sheet once App Store
  Connect has assigned one.
* **Game facts** used across the site: 3 realms, 45 story puzzles, 12 chapters, Endless Weave
  expeditions of five puzzles, six puzzle flavours, a Daily Discovery, unlimited hints and undo,
  the accessibility switches named in Settings, iPhone only, iOS 26 or later, English only.

## App Store badge

Apple's "Download on the App Store" badge is official artwork and must not be redrawn, so the site
ships a neutral "Coming soon" button in its place. When the app is live:

1. Download the badge from Apple's
   [App Store marketing resources](https://developer.apple.com/app-store/marketing/guidelines/)
   and save the SVG as `assets/img/app-store-badge.svg`.
2. In `index.html`, replace each `<a class="store-badge" …>…</a>` block (there are two) with:

   ```html
   <a class="store-badge-official" href="https://apps.apple.com/app/idAPP_STORE_ID">
     <img src="assets/img/app-store-badge.svg" alt="Download on the App Store" width="168" height="56">
   </a>
   ```

   The `store-badge-official` style already exists in `site.css`. Follow Apple's rules for
   clear space and do not recolour the badge.

## How the site is published

The site is served by GitHub Pages from the public repository
[Sadra-Makhmali/FOLD](https://github.com/Sadra-Makhmali/FOLD), branch `gh-pages`, at
<https://foldgame.app>. No server is involved. DNS for the domain is managed at Cloudflare.

### Publish a change

```bash
./publish.sh "What changed"
```

Run it inside this folder. The script copies the folder into a temporary clone of the
`gh-pages` branch, commits and pushes. It leaves no `.git` folder here, so `website/` can stay
inside the game's own repository. GitHub can take up to 10 minutes to show a change.

The script signs in with a deploy key that only has access to this one repository:

* private key on this Mac: `~/.ssh/fold_website_deploy_ed25519`
* public key on GitHub: repository **Settings → Deploy keys**, with **Allow write access** ticked

On another Mac, create a new key pair, add its public key as a second deploy key, and keep the
same file name. To revoke access, delete the deploy key on GitHub.

### GitHub settings (repository Settings → Pages)

| Setting | Value |
|---|---|
| Source | Deploy from a branch |
| Branch | `gh-pages`, folder `/ (root)` |
| Custom domain | `foldgame.app` (the `CNAME` file in this folder says the same) |
| Enforce HTTPS | ticked, once GitHub offers it (can take up to 24 hours after the DNS check passes) |

GitHub Pages on a free account only publishes from a public repository, and a Pages site is
public even when its repository is private. `.nojekyll` (an empty file) turns off GitHub's
default Jekyll processing so files are served exactly as they are. Keep it.

Recommended once: verify the domain so nobody else on GitHub can claim it. Profile picture →
**Settings** (account, not repository) → **Pages** → **Add a domain** → `foldgame.app`, then
create the TXT record GitHub shows (its name has the form
`_github-pages-challenge-Sadra-Makhmali.foldgame.app`) at Cloudflare and press **Verify**. Keep
the record afterwards.

### DNS records at Cloudflare

All website records must be set to **DNS only** (grey cloud), not Proxied. With the proxy on,
Cloudflare by default injects a Web Analytics script and rewrites email addresses with its own
script, which would make the "no analytics, no third-party scripts" statements on this site and
in the privacy policy untrue. If the proxy is ever wanted, turn those two features off in
Cloudflare and mention Cloudflare in `privacy/index.html`.

| Type | Name | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `sadra-makhmali.github.io` |
| TXT | `_github-pages-challenge-Sadra-Makhmali` | the code GitHub shows when verifying the domain |

With the `www` record in place GitHub redirects `www.foldgame.app` to `foldgame.app`. Do not add
a wildcard (`*`) record. `.app` domains only work over HTTPS in browsers, so the site shows a
certificate error until GitHub has issued its certificate for the domain.

### Check

```bash
dig foldgame.app +noall +answer -t A
```

```bash
dig www.foldgame.app +nostats +nocomments +nocmd
```

```bash
curl -sI https://foldgame.app/ | head -5
```

The first should list the four `185.199.x.153` addresses, the second the CNAME to
`sadra-makhmali.github.io`, the third `HTTP/2 200`. Then open <https://foldgame.app/>,
<https://foldgame.app/privacy/>, <https://foldgame.app/support/> and a made-up address such as
<https://foldgame.app/nope> (it should show the "come unfolded" page).

### URLs for App Store Connect

| Field | URL |
|---|---|
| Privacy Policy URL | `https://foldgame.app/privacy/` |
| Support URL | `https://foldgame.app/support/` |
| Marketing URL (optional) | `https://foldgame.app/` |

## Editing notes

* The header, footer and the hidden SVG block at the top of `<body>` are repeated in all six HTML
  files. Change them in every file.
* Links are relative (`../support/`) so the site also works when opened from a sub-path. The exception is `404.html`,
  which uses root-absolute links (`/support/`) because GitHub serves it for addresses at any
  depth; it only looks right on the real domain or a local server.
* Colours are CSS variables at the top of `assets/css/site.css`, with the dark theme in the
  `prefers-color-scheme: dark` block right below. The site follows the visitor's system theme and
  their "reduce motion" setting.
* The site stores nothing in the browser and loads nothing from other servers. The privacy
  policy says so; keep it true if you add anything.
* This README is published with the site (as `/README.md`). It is harmless and hidden from
  search engines in `robots.txt`. To keep it out, add `--exclude 'README.md'` to the `rsync` line
  in `publish.sh`.

## GitHub documentation used

* [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
* [Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
* [Managing a custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
* [Verifying your custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
* [Securing your site with HTTPS](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https)
* [Creating a custom 404 page](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site)
* [What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
