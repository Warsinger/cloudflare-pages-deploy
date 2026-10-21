import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updatePreviewComment } from './preview-comment.mjs';

const config = {repo: 'Warsinger/space-invaders-go', hostname: 'alien-invaders.pages.dev', title: 'Space Invaders', marker: '<!-- space-invaders-preview -->'};
const args = ['18', 'https://pr-18.alien-invaders.pages.dev/', 'a'.repeat(40), 'https://github.com/Warsinger/space-invaders-go/actions/runs/123', config];
test('creates a linked preview comment after searching all pages', async () => {
  const calls = [];
  await updatePreviewComment(async (endpoint, options) => {
    calls.push({ endpoint, options });
    if (endpoint.endsWith('&page=1')) return Array.from({ length: 100 }, () => ({ body: 'unrelated' }));
    if (endpoint.endsWith('&page=2')) return [];
    assert.equal(options.method, 'POST');
    assert.match(options.body.body, /\[Open Space Invaders\]\(https:\/\/pr-18.alien-invaders.pages.dev\/\)/);
    return {};
  }, ...args);
  assert.equal(calls.length, 3);
});
test('updates its own comment and repeated identical runs do not write', async () => {
  let stored = { id: 42, user: { login: 'github-actions[bot]' }, body: '<!-- space-invaders-preview -->old' };
  let writes = 0;
  const github = async (endpoint, options) => {
    if (!options) return [stored];
    assert.equal(endpoint, 'issues/comments/42');
    assert.equal(options.method, 'PATCH');
    writes++;
    stored = { ...stored, body: options.body.body };
    return stored;
  };
  await updatePreviewComment(github, ...args);
  await updatePreviewComment(github, ...args);
  assert.equal(writes, 1);
});
test('does not edit another author and rejects mismatched preview URLs', async () => {
  await updatePreviewComment(async (_, options) => {
    if (!options) return [{ id: 1, user: { login: 'Warsinger' }, body: '<!-- space-invaders-preview -->' }];
    assert.equal(options.method, 'POST');
    return {};
  }, ...args);
  await assert.rejects(updatePreviewComment(async () => { throw new Error('API must not run'); }, '19', ...args.slice(1)), /Invalid preview/);
});
