#!/usr/bin/env node
import express from "express";
import cors from "cors";
const app = express();
const port = process.env.PORT || 3003;
app.use(cors());
app.use(express.json());
let policies = [
  { id: "policy-1", name: "Default Allow Verified", description: "Allow actions for verified agents", enabled: true, createdAt: new Date().toISOString(), rules: [ { id: "r1", name: "allow-verified", enabled: true, action: { type: "allow" } } ] },
  { id: "policy-2", name: "Deny Untrusted Risky", description: "Deny risky ops for untrusted", enabled: true, createdAt: new Date().toISOString(), rules: [ { id: "r2", name: "deny-untrusted", enabled: true, action: { type: "deny" } } ] }
];
app.get("/health", (_, res) => res.json({ status: "healthy", service: "mock-permission-service" }));
app.get("/policies", (_, res) => res.json({ policies }));
app.post("/policies/simulate", (req, res) => {
  const { policyDocument, context } = req.body || {};
  const trust = context?.trustLevel || "untrusted";
  const decision = trust === "verified" || trust === "enterprise" ? "allow" : trust === "basic" ? "throttle" : "deny";
  res.json({ decision, processingTime: 3, reason: `Mock decision for trust=${trust}`, matchedRule: { name: decision } });
});
app.listen(port, () => console.log(`Mock Permission Service on ${port}`));
