# Shared deployment workflow

Keep this repository independent of app builds, languages and gameplay. Use the builder identity and assign issues/PRs to Warsinger. Never merge PRs without authorization. Preserve current-main and same-repository manual-preview validation, exact pre-existing Cloudflare project/hostname checks and bot-owned idempotent preview comments. Never create Cloudflare projects or store credentials here. Run `node --test scripts/*.test.mjs` for script changes; verify a caller preview before release. Consumers pin reviewed commit revisions.
