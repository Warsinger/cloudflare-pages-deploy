import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
test('validation checks the downloaded artifact and actual Pages hostname before exposing a branch',()=>{
  const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'pages-validation-'));
  try {
    fs.mkdirSync(path.join(cwd,'build/pages'),{recursive:true});
    const output=path.join(cwd,'outputs');
    const sha='a'.repeat(40);
    const env={...process.env,GITHUB_REPOSITORY:'example-owner/example',GITHUB_SHA:sha,GITHUB_REF:'refs/heads/main',GITHUB_EVENT_NAME:'push',GITHUB_OUTPUT:output,GITHUB_TOKEN:'test-only',CLOUDFLARE_API_TOKEN:'test-only',CLOUDFLARE_ACCOUNT_ID:'test-account',PAGES_PROJECT:'example',PAGES_HOSTNAME:'example.pages.dev',PAGES_CHECK_REVISION:'true'};
    for(const [revision,hostname,success] of [[sha,'example.pages.dev',true],['b'.repeat(40),'example.pages.dev',false],[sha,'other.pages.dev',false]]){
      fs.writeFileSync(path.join(cwd,'build/pages/version.json'),JSON.stringify({revision}));
      fs.writeFileSync(output,'');
      const code=`process.argv[2]='validate';globalThis.fetch=async url=>Response.json(url.startsWith('https://api.github.com/')?{object:{sha:${JSON.stringify(sha)}}}:{success:true,result:{name:'example',production_branch:'main',subdomain:${JSON.stringify(hostname)}}});await import(${JSON.stringify(new URL('./deploy-pages.mjs',import.meta.url).href)});`;
      const result=spawnSync(process.execPath,['--input-type=module','-e',code],{cwd,env,encoding:'utf8'});
      assert.equal(result.status===0,success,result.stderr);
      assert.equal(fs.readFileSync(output,'utf8'),success?'branch=main\n':'');
    }
  } finally { fs.rmSync(cwd,{recursive:true,force:true}); }
});
