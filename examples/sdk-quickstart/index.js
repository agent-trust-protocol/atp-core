// Minimal quickstart using fetch to call ATP services
// Usage:
//   node examples/sdk-quickstart/index.js

import fetch from 'node-fetch'

const base = {
  identity: process.env.ATP_ID || 'http://localhost:3001',
  permission: process.env.ATP_PERM || 'http://localhost:3003',
  audit: process.env.ATP_AUD || 'http://localhost:3006'
}

async function main() {
  // 1) Identity list
  const idRes = await fetch(`${base.identity}/identity`)
  const idJson = await idRes.json()
  console.log('Identity count:', idJson.count ?? idJson.data?.length ?? 0)

  // 2) Policies
  const polRes = await fetch(`${base.permission}/policies`)
  const polJson = await polRes.json()
  console.log('Policies:', polJson.policies?.map(p => p.name))

  // 3) Simulate
  const simRes = await fetch(`${base.permission}/policies/simulate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ policyDocument: { id: 'policy-1' }, context: { trustLevel: 'verified' } })
  })
  const simJson = await simRes.json()
  console.log('Decision:', simJson.decision)

  // 4) Audit stats
  const auRes = await fetch(`${base.audit}/audit/stats`)
  const auJson = await auRes.json()
  console.log('Total events:', auJson.stats?.totalEvents)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})


