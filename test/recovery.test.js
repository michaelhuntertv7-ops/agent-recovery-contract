import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcile, mayExecute } from '../src/recovery.js';

const base = () => ({
  condition: '19:00',
  actions: {
    A1: { status: 'COMPLETED', requires: [] },
    A2: { status: 'FAILED', requires: ['A1'] },
    A3: { status: 'BLOCKED', requires: ['A2'], dependsOnCondition: true }
  },
  eligible: []
});

test('completed consequences never regress', () => {
  const out = reconcile(base(), { actions: { A1: { failed: true } } });
  assert.equal(out.actions.A1.status, 'COMPLETED');
});

test('failed attempt never becomes completion without evidence', () => {
  const out = reconcile(base(), {});
  assert.equal(out.actions.A2.status, 'FAILED');
  assert.equal(mayExecute(out, 'A3'), false);
});

test('explicit completion evidence resolves a failed action', () => {
  const out = reconcile(base(), { actions: { A2: { completed: true, evidence: 'ride-confirmation-42' } } });
  assert.equal(out.actions.A2.status, 'COMPLETED');
  assert.equal(out.actions.A2.evidence, 'ride-confirmation-42');
});

test('downstream action becomes eligible only after prerequisite completion', () => {
  const out = reconcile(base(), { actions: { A2: { completed: true } } });
  assert.deepEqual(out.eligible, ['A3']);
});

test('changed condition is recorded before resumption', () => {
  const out = reconcile(base(), { condition: '19:30' });
  assert.equal(out.condition, '19:30');
  assert.equal(out.events.at(-1).type, 'CONDITION_REPLACED');
});

test('unknown evidence cannot create a new action', () => {
  const out = reconcile(base(), { actions: { AX: { completed: true } } });
  assert.equal(out.actions.AX, undefined);
});

test('workflow is incomplete while any required action is unresolved', () => {
  const out = reconcile(base(), {});
  assert.equal(out.complete, false);
});

test('workflow completes only when all required actions have completion evidence', () => {
  let out = reconcile(base(), { actions: { A2: { completed: true } } });
  out = reconcile(out, { actions: { A3: { completed: true, evidence: 'departure-plan-7' } } });
  assert.equal(out.complete, true);
});
