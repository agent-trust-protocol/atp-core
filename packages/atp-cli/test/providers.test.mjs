import { test } from 'node:test';
import assert from 'node:assert/strict';
import { providerConfig, askModel } from '../src/providers.mjs';
import { respond } from '../src/cli.mjs';

test('default selects Ollama loopback and makes no request', () => {
  assert.deepEqual(providerConfig({}), { provider: 'local', category: 'free-local', model: 'qwen3:4b', endpoint: 'http://127.0.0.1:11434/api/chat' });
  assert.match(respond('/ask'), /read-only question/);
});
test('hosted free requires explicit network access and credentials', () => {
  assert.throws(()=>providerConfig({ ATP_LLM_PROVIDER:'free', OPENROUTER_API_KEY:'test' }), /disabled/);
  assert.throws(()=>providerConfig({ ATP_LLM_PROVIDER:'free', ATP_ALLOW_NETWORK:'1' }), /OPENROUTER_API_KEY/);
  const cfg=providerConfig({ ATP_LLM_PROVIDER:'free', ATP_ALLOW_NETWORK:'1', OPENROUTER_API_KEY:'test' });
  assert.equal(cfg.model, 'openrouter/free');
  assert.equal(cfg.category, 'free-hosted');
});
test('paid inference requires independent opt-ins and exact model', () => {
  const basic={ ATP_LLM_PROVIDER:'paid', OPENROUTER_API_KEY:'test', ATP_PAID_MODEL:'anthropic/claude-sonnet-4', ATP_ALLOW_NETWORK:'1' };
  assert.throws(()=>providerConfig(basic), /Paid models are disabled/);
  assert.equal(providerConfig({...basic,ATP_ALLOW_PAID:'1'}).category, 'paid-opt-in');
  assert.throws(()=>providerConfig({...basic,ATP_ALLOW_PAID:'1',ATP_PAID_MODEL:'openrouter/free'}), /Invalid ATP_PAID_MODEL/);
});
test('local model request uses mocked Ollama with no remote fallback', async()=>{
  let seen;
  const answer=await askModel('Explain Guardian', { env:{}, fetchImpl:async(url, options)=>{
    seen={url,body:JSON.parse(options.body),headers:options.headers};
    return {ok:true,json:async()=>({model:'qwen3:4b',message:{content:'Guardian is a policy gate.'}})};
  }});
  assert.equal(seen.url,'http://127.0.0.1:11434/api/chat');
  assert.equal(seen.body.stream,false);
  assert.equal(seen.headers.Authorization,undefined);
  assert.equal(answer.trusted,false);
});
test('free router request only uses free model', async()=>{
  let body;
  await askModel('Explain DID', {env:{ATP_LLM_PROVIDER:'free',ATP_ALLOW_NETWORK:'1',OPENROUTER_API_KEY:'test'},fetchImpl:async (_url, options)=>{
    body=JSON.parse(options.body);
    return {ok:true,json:async()=>({choices:[{message:{content:'DID'}}]})};
  }});
  assert.equal(body.model,'openrouter/free');
});
test('failed local request never uses a hosted fallback', async()=>{
  let calls=0;
  await assert.rejects(askModel('Agent', {env:{},fetchImpl:async()=>{calls++;throw new Error('connection refused');}}), /No hosted fallback was attempted/);
  assert.equal(calls,1);
});
test('never make a request without required explicit consent', async()=>{
  let calls=0;
  await assert.rejects(askModel('Agent',{env:{ATP_LLM_PROVIDER:'paid',ATP_ALLOW_NETWORK:'1',OPENROUTER_API_KEY:'secret',ATP_PAID_MODEL:'openai/gpt-4o'},fetchImpl:async()=>{calls++;return {ok:true};}}),/Paid models are disabled/);
  assert.equal(calls,0);
});
