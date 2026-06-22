# PlaySputnik production API

The production backend is a small Cloudflare Worker. GitHub Pages remains the
frontend host. The Worker exposes:

- `GET /api/health` — provider readiness, no secret values.
- `GET /api/search?q=...` — RAWG metadata candidates, cached at the edge for
  six hours. Prices and subscription state are intentionally not claimed.
- `POST /api/narrative` — optional locale-aware Anthropic copy from structured
  game/taste facts. Personalized responses are never cached at the edge.

The public Worker deliberately does **not** expose `/api/psn`. NPSSO is a
sensitive account token; PSN import stays local until PlaySputnik has accounts,
explicit consent, encrypted token handling, revocation, and a dedicated
security review.

## Live deployment

- Worker: `https://playsputnik-api.playsputnik.workers.dev`
- GitHub Pages variable: `PLAYSPUTNIK_API_ORIGIN`
- RAWG search: active through a Cloudflare encrypted secret
- AI narratives: inactive until `ANTHROPIC_API_KEY` is added

The live Pages app has been browser-verified in `production` API mode with
cached RAWG search results and cover candidates.

## First deployment

No custom domain is required. Cloudflare provides a `workers.dev` HTTPS URL.

1. Create a free Cloudflare account and enable the Workers subdomain.
2. Authenticate Wrangler:

   ```sh
   npx wrangler@4 login
   ```

3. Store provider keys as Worker secrets:

   ```sh
   npx wrangler@4 secret put RAWG_API_KEY --config backend/wrangler.toml
   npx wrangler@4 secret put ANTHROPIC_API_KEY --config backend/wrangler.toml
   ```

   `ANTHROPIC_API_KEY` is optional. Search works without it; AI narratives use
   the deterministic client fallback.

4. Deploy:

   ```sh
   npx wrangler@4 deploy --config backend/wrangler.toml
   ```

5. Verify the returned URL:

   ```sh
   curl https://playsputnik-api.<account>.workers.dev/api/health
   ```

## Connect GitHub Pages

In the GitHub repository:

1. Add repository variable `PLAYSPUTNIK_API_ORIGIN` with the Worker origin,
   without a trailing slash.
2. Re-run **Deploy to GitHub Pages**.

`scripts/configure-runtime.mjs` writes that public URL into the deployment
artifact. API keys never enter `runtime-config.js`, the repository, or browser
storage. If the variable is absent, the static app keeps its local/offline
fallback behavior.

## Optional backend workflow

The manual **Deploy production backend** workflow expects:

- secret `CLOUDFLARE_API_TOKEN`
- secret `CLOUDFLARE_ACCOUNT_ID`

Create a narrowly scoped Cloudflare API token that can edit Workers scripts.
The workflow deploys code only; Worker secrets remain stored in Cloudflare.

## Local verification

```sh
./scripts/check.sh --fast
```

The normal gate runs `scripts/backend-worker-test.mjs`, covering CORS, health,
RAWG normalization, cache hits, narrative secrets, input validation, and the
absence of a public PSN endpoint.
