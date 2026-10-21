import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pagesProject } from './pages-project.mjs';
const valid = { name: 'alien-invaders', production_branch: 'main', source: null };
const result = () => new Response(JSON.stringify({ success: true, result: valid }));
test('existing project requires no mutation', async () => {
  let calls = 0;
  assert.deepEqual(await pagesProject(async (_, options) => { calls++; assert.equal(options.method, undefined); return result(); }, 'https://example.test/projects', {}, 'alien-invaders'), valid);
  assert.equal(calls, 1);
});
test('wrong project, production branch or Git integration is rejected', async () => {
  for (const project of [{...valid,name:'other'},{...valid,production_branch:'other'},{...valid,source:{type:'github'}}]) {
    await assert.rejects(pagesProject(async () => new Response(JSON.stringify({success:true,result:project})), 'https://example.test/projects', {}, 'alien-invaders'), /Expected/);
  }
});
test('missing projects without setup and access failures never trigger creation', async () => {
  for (const status of [404, 401, 403]) {
    let calls = 0;
    await assert.rejects(pagesProject(async () => { calls++; return new Response('', { status }); }, 'https://example.test/projects', {}), /HTTP/);
    assert.equal(calls, 1);
  }
});
