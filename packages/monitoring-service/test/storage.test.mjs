import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MetricsStorage } from '../.test-dist/services/metrics-storage.js';

test('sqlite3 native storage: immediate write, history, latest, retention and reopen', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atp-metrics-'));
  const path = join(dir, 'metrics.db');
  let db = new MetricsStorage(path);
  const fresh = { timestamp: new Date().toISOString(), services: [], performance: { activeConnections: 7 }, security: {}, business: {} };
  const old = { ...fresh, timestamp: new Date(Date.now() - 40 * 86400000).toISOString() };
  try {
    // No sleep: initialization must finish before the first write.
    await db.storeMetrics(old);
    await db.storeMetrics(fresh);
    assert.deepEqual(await db.getLatestMetrics(), fresh);
    assert.deepEqual(await db.getMetricsHistory({ timeRange: 'day', limit: 1 }), [fresh]);
    await db.cleanup();
    await db.close();
    db = new MetricsStorage(path);
    assert.deepEqual(await db.getLatestMetrics(), fresh);
    // A far-future clock exposes retained rows without reaching into private state.
    const realNow = Date.now;
    Date.now = () => realNow() + 80 * 86400000;
    try { await db.cleanup(); } finally { Date.now = realNow; }
    assert.equal(await db.getLatestMetrics(), null);
  } finally { await db.close(); await rm(dir, { recursive: true, force: true }); }
});

test('upgraded cron supports the service schedule/stop lifecycle', async () => {
  const { default: cron } = await import('node-cron');
  assert.equal(cron.validate('0 * * * *'), true);
  const task = cron.schedule('0 * * * *', () => { throw new Error('test must not execute scheduled cleanup'); });
  task.stop();
  task.destroy();
});
