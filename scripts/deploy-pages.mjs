import { updatePreviewComment } from './preview-comment.mjs';
import { pagesProject } from './pages-project.mjs';
import { deploymentBranch } from './pages-target.mjs';
import fs from 'node:fs';
import { configuration } from './config.mjs';

const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
const config = configuration(process.env);
const { repo, hostname, project } = config;
const sha = process.env.GITHUB_SHA;

async function github(endpoint, options = {}) {
  const response = await fetch(`https://api.github.com/repos/${repo}/${endpoint}`, {
    method: options.method || 'GET',
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) throw new Error(`GitHub validation failed: HTTP ${response.status}`);
  return response.json();
}

const branch = await deploymentBranch(process.env, github);

if (process.argv[2] === 'validate') {
  if (!account || !token) throw new Error('Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN repository secrets');
  const target = await pagesProject(fetch, `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/pages/projects`,
    { Authorization: `Bearer ${token}` }, project);
  if (target.subdomain !== hostname) throw new Error('Unexpected Pages hostname');
  if (process.env.PAGES_CHECK_REVISION !== 'false') {
    const version = JSON.parse(fs.readFileSync('build/pages/version.json', 'utf8'));
    if (version.revision !== sha) throw new Error('Artifact revision does not match the checked workflow revision');
  }
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `branch=${branch}\n`);
} else if (process.argv[2] === 'comment') {
  if (branch !== 'main') await updatePreviewComment(github, process.env.PREVIEW_PR,
    `https://${branch}.${hostname}/`, sha,
    `https://github.com/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`, config);
} else {
  throw new Error('Choose validate or comment');
}
