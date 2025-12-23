#!/usr/bin/env node
import express from "express";
import cors from "cors";
const app = express();
const port = process.env.PORT || 3006;
app.use(cors());
app.use(express.json());
app.get("/health", (_, res) => res.json({ status: "healthy", service: "mock-audit-service" }));
app.get("/audit/stats", (_, res) => res.json({ success: true, stats: { totalEvents: 1234, eventsBySource: { "policy_evaluation": 800, "identity-service": 200, "example-agent": 150, "test-service": 84 } } }));
app.get("/audit/events", (_, res) => {
  const now = Date.now();
  const events = Array.from({ length: 10 }).map((_, i) => ({
    id: `e-${i}`,
    timestamp: new Date(now - i * 60000).toISOString(),
    source: i % 2 === 0 ? "policy_evaluation" : "example-agent",
    action: i % 2 === 0 ? "allow" : "deny",
    resource: i % 2 === 0 ? "tool:db" : "tool:write",
    actor: `did:atp:test:${i}`,
    hash: `hash-${i}`
  }));
  res.json({ success: true, events });
});
app.listen(port, () => console.log(`Mock Audit Service on ${port}`));
