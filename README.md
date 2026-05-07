# Conexão Website Rebuild

Static rebuild of `sarahforro.com` for the future `conexao.be` or `conexao.dance`.

## Development

Install dependencies:

```bash
npm install
```

Compile the stylesheet:

```bash
npm run build
```

Watch the stylesheet during edits:

```bash
npm run watch:css
```

Run the full local verification suite:

```bash
npm run verify
```

This runs SCSS linting, rebuilds generated assets, and checks text contrast on the active themes. It expects the local static server to be available at `http://127.0.0.1:8000/`.

Run only the contrast audit:

```bash
npm run test:contrast
```

The contrast audit can be configured with environment variables:

```bash
BASE_URL=http://127.0.0.1:8000 THEMES=beta,zeta PAGES=index.html,classes.html npm run test:contrast
```

The static pages live in `site/`.

Generated assets live in `site/assets/` and are intentionally not tracked:

- `site/assets/app.js`
- `site/assets/theme-*.css`
- `site/assets/theme-*.css.map`

Regenerate them with `npm run build`.

Extract the source material into structured Markdown:

```bash
./scripts/extract_structured_content.py
```

## Current structure

- `site/`: static HTML pages and compiled assets
- `content-source/`: structured content extracted from the existing site, used as the migration base
- `src/data/`: small structured data files shared across the site
- `src/styles/`: SCSS source
- `docs/`: product and visual brief
- `design/`: visual system notes, including theme token definitions
- `site-source/`: collected material from the current live site

## Themes

The selectable themes are currently:

- Beta
- Epsilon
- Zeta
- Eta

Alpha and Gamma remain in the source/build as inactive reference themes, but are not selectable in the public theme switcher.

Theme tokens are documented in `design/theme-tokens.md`.

## Term state model

The site should distinguish between:

1. the current term
2. the next term
3. the registration state

Registration is not always open, and when it is open it should only point to the next term. The shared source of truth currently lives in `src/data/site.json`.

## Current approach

The current HTML pages are intentionally minimal. The priority is to:

1. extract and preserve source content
2. organize it by page and hierarchy
3. reincorporate it progressively into `site/`
