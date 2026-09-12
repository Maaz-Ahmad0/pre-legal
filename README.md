# Pre-Legal

Web app for creating a filled **Mutual Non-Disclosure Agreement** ([PLDP-3](https://maaz-ahmad0.atlassian.net/browse/PLDP-3)).

## What it does

1. Enter party details and key cover-page terms in a form  
2. Preview the Mutual NDA with your information filled in  
3. Download the completed document locally (Markdown)

Templates are based on the [Common Paper Mutual NDA](https://commonpaper.com/standards/mutual-nda/1.0) (CC BY 4.0). See `LICENCE` and `templates/`.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build && npm start
```

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
