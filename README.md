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

The static pages live in `site/`.

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
- `site-source/`: collected material from the current live site

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
