# Video portfolio

A one-page portfolio site in plain HTML, CSS and JavaScript. There's no build step, so GitHub Pages serves it as it is.

## Where things live

| What | File |
|---|---|
| Your name, email, socials, hero reel | `assets/js/content.js` (the `SITE` block) |
| Your projects (the work grid) | `assets/js/content.js` (the `PROJECTS` list) |
| Page text and sections | `index.html`, `about.html` |
| One page per project | `work/` |
| The page shown for a broken link | `404.html` |
| Colours, fonts, layout | `assets/css/style.css` (colour tokens at the top) |
| Animation and interaction | `assets/js/main.js` |

## Adding your work

1. Upload the full video to YouTube or Vimeo.
2. In `assets/js/content.js`, add its ID to a project:
   - `youtube: 'dQw4w9WgXcQ'` (the part after `watch?v=`)
   - `vimeo: '76979871'` (the number at the end of the link)
3. Optional: add a still frame (`poster`) and a silent 3 to 6 second loop (`preview`) that plays on hover. Put them in `assets/img/` and `assets/video/`. A YouTube video's thumbnail works as a poster: `https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg`.
4. Give it a page: copy a file in `work/`, rename it, and change the video ID, title, details and text inside. Then set `page: '/work/your-file'` on the project (no `.html`: the site uses clean addresses like `/work/summernats-2026`) so its tile links there. Update each page's "Next project" link so they chain together.

The filter buttons above the grid only appear once there are 4 or more projects.

Keep every file in this folder under about 20 MB. GitHub isn't a video host, so full-length videos belong on YouTube or Vimeo.

## Hero reel

The top of the home page plays a muted, looping reel behind the Kutt logo. To swap it, compress a clip (keep it under about 15 MB) and point `heroReel` in `content.js` at it:

```
ffmpeg -i your-clip.mp4 -vf scale=1600:-2 -c:v libx264 -crf 27 -preset slow -pix_fmt yuv420p -movflags +faststart -an assets/video/hero-reel.mp4
ffmpeg -ss 5 -i assets/video/hero-reel.mp4 -frames:v 1 -q:v 3 assets/img/hero-poster.jpg
```

Phones and reduced-motion visitors see `heroPoster` (a still frame) instead of the reel.

## Logo

Web copies of the Kutt logo (SVG, cropped to the artwork) live in `assets/img/logo/`. The full logo packs (`Kutt-Logo-PNG/`, `Kutt-Logo-SVG/`) are kept out of the published site by `.gitignore`. Headings use the logo as a word with `<span class="kutt-word">`; the logo typeface is Unbounded Black (900).

## Preview locally

```
python serve.py
```

Open http://localhost:5173. `serve.py` behaves like GitHub Pages: `/about` opens `about.html`, and a missing page shows `404.html`. (Python's plain `http.server` can't do that, so links between pages would break.)

## Publish on GitHub Pages

1. Create a public repository on GitHub. Naming it `yourusername.github.io` puts the site at that address.
2. Push this folder to it.
3. In the repository, go to Settings, then Pages, then Deploy from a branch, and pick `main` and `/ (root)`.
