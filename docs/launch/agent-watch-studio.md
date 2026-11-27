# Agent Watch in ATP Studio

## Sequence

1. Validate the CLI demo with a first-time developer. Ask which action was blocked, why, and where they found the evidence. Record time to the correct answer.
2. Build a Studio adapter against the existing authenticated Guardian evidence read path. Check the contract and authorization before selecting an endpoint. Map requests, decisions and execution outcomes by stable action ID. Keep decisions and outcomes distinct.
3. Add a read-only floor view and reuse Vento Core controls, accessible event list, and evidence panel. Preserve selection between floor, list and replay. Label the source and show its last update time. Display missing outcomes explicitly and pause live advancement when the feed is stale.
4. Verify in staging with one permitted fixture read and one denied harmless fixture write. Compare the floor, list and evidence record for each event, and confirm the write fixture stayed unchanged. Test keyboard navigation, reduced motion, reconnect, duplicate and out-of-order events, and tenant isolation before rollout.

The CLI demo uses CSS and plain browser JavaScript to keep the install small. Evaluate PixiJS if Studio needs larger fleets, sprites, or pan and zoom. Keep interaction controls and evidence in the accessible DOM. The visualization consumes evidence; authorization and execution stay in the runtime.
