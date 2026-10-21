import test from 'node:test';
import assert from 'node:assert/strict';
import { configuration } from './config.mjs';
import { deploymentBranch } from './pages-target.mjs';
import { pagesProject } from './pages-project.mjs';
import { updatePreviewComment } from './preview-comment.mjs';
for (const [repo, project] of [['example-game','example-game-site'],['example-visualizer','example-viz-site'],['example-landing','example-landing-site']]) {
  test(`configuration and preview are reusable by ${repo}`, async () => {
    const env = {GITHUB_REPOSITORY:`example-owner/${repo}`,PAGES_PROJECT:project,PAGES_HOSTNAME:`${project}.pages.dev`,GITHUB_SHA:'a'.repeat(40),GITHUB_EVENT_NAME:'workflow_dispatch',GITHUB_REF:'refs/heads/feature',PREVIEW_PR:'9'};
    const config=configuration(env);
    const branch=await deploymentBranch(env,async()=>({state:'open',base:{ref:'main'},head:{sha:env.GITHUB_SHA,ref:'feature',repo:{full_name:config.repo}}}));
    assert.equal(branch,'pr-9');
    const target={name:project,subdomain:env.PAGES_HOSTNAME,production_branch:'main'};
    assert.deepEqual(await pagesProject(async url=>{assert.equal(url,`https://example.test/${project}`);return Response.json({success:true,result:target});},'https://example.test',{},project),target);
    let body;
    await updatePreviewComment(async(_,options)=>{if(!options)return [];body=options.body.body;},'9',`https://pr-9.${config.hostname}/`,env.GITHUB_SHA,`https://github.com/${config.repo}/actions/runs/123`,config);
    assert.ok(body.includes(config.hostname));assert.ok(body.includes(config.repo));
  });
}
test('configuration rejects command and comment injection',()=>{
  const env={GITHUB_REPOSITORY:'example-owner/example',PAGES_PROJECT:'example',PAGES_HOSTNAME:'example.pages.dev'};
  for(const change of [{PAGES_PROJECT:'example; echo bad'},{PAGES_HOSTNAME:'evil.test'},{PAGES_TITLE:'[bad](https://evil.test)'},{PAGES_COMMENT_MARKER:'invalid'},{GITHUB_REPOSITORY:''}])assert.throws(()=>configuration({...env,...change}));
});
