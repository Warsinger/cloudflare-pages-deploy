# Cloudflare Pages deployment

A reusable GitHub Actions workflow for existing Cloudflare Pages Direct Upload
projects. Uses Cloudflare's official Wrangler action; application builds remain
in each application repository. No secrets, game code or app build dependencies
are stored here.

## Call the workflow

After a reviewed commit is published, replace both `SHARED_COMMIT_SHA` values
below with that same full commit SHA. The workflow reference pins the workflow;
`deployment-ref` pins the scripts checked out by that workflow. GitHub's reusable
workflow context describes the caller, so the implementation checkout must be
explicit rather than checking out the caller or an unpinned main branch.

```yaml
  deploy:
    needs: [build]
    if: (github.event_name == 'push' && github.ref == 'refs/heads/main') || (github.event_name == 'workflow_dispatch' && inputs.deploy)
    uses: Warsinger/cloudflare-pages-deploy/.github/workflows/pages.yml@SHARED_COMMIT_SHA
    permissions:
      contents: read
      pull-requests: write
      deployments: write
    with:
      deployment-ref: SHARED_COMMIT_SHA
      artifact-name: example-web
      project-name: example-site
      hostname: example-site.pages.dev
      title: Example App
      preview-pr: ${{ inputs.preview_pr }}
      comment-marker: '<!-- example-preview -->'
    secrets:
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

Callers build/test first and upload the complete static directory using
`actions/upload-artifact`. The workflow downloads that artifact to `build/pages`.
Default revision checking requires `version.json` with a `revision` equal to the
caller SHA. Apps without that manifest can explicitly set `check-revision: false`;
they retain current-ref and same-workflow artifact isolation but lose the extra
manifest check. Callers with revision manifests should keep the default.

Only pushes and manual dispatch can publish. Production must be the current main
revision. A preview requires the current head of an open same-repository PR to
main and manual dispatch on that branch. Forks, closed/stale PRs, wrong projects,
wrong hostnames, Git-integrated projects and missing projects fail closed. No
project or account is created. Publication is serialized per caller/project.
Cloudflare credentials are explicitly passed from each caller's repository.

The official action creates linked job summaries and GitHub deployment records.
Preview comments are updated in place only when owned by github-actions[bot];
carry forward the app's old marker to update its existing comments. Source refs
are rechecked before comments are posted. A branch can change during an upload;
post-upload validation suppresses a stale comment but cannot undo the upload.

To adopt in another app, keep its packaging/build tests, upload a static artifact,
configure its existing project/hostname and manually verify a PR preview before
merging. No app migration happens automatically. Pin reviewed shared commits and
review both SHA references together when upgrading. Test production only after
an approved consumer merge; Cloudflare rollback remains an owner operation.

## Development

Run `node --test scripts/*.test.mjs` (Node 24). Tests cover project lookup without
mutation, current main/manual preview policy, fork/stale rejection, paginated
bot-owned idempotent comments, invalid inputs, and configuration for several independent
example callers. Hosted preview/production checks are separate from
unit tests. Wrangler is pinned to 4.151.1 and its official action to a reviewed
v4 commit; dependency updates require review.

## Callers with lifecycle coordination

Use `Warsinger/cloudflare-pages-deploy/upload@SHARED_COMMIT_SHA` as a step when
existing pause/cleanup/maintenance policies must surround an upload inside the
caller's own serialized job. Pass `api-token`, `account-id`, `github-token` and
`command` (a trusted, correctly quoted `pages deploy` command). This thin action
centralizes the same pinned official action and Wrangler version; it does not
replace or bypass the caller's validation, queue, preflight or post-upload checks.
Prefer the reusable workflow above for ordinary stateless callers. Do not put
untrusted event text directly into `command`; preserve an argument boundary for
every value, and run lifecycle checks before invoking the action. The command is
parsed by the official action's argument parser, not a shell script.
