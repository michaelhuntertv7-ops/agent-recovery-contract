export const TERMINAL = new Set(['COMPLETED']);

export function reconcile(state, observation = {}) {
  const next = structuredClone(state);
  next.events ??= [];

  if (observation.condition && observation.condition !== next.condition) {
    const previous = next.condition;
    next.condition = observation.condition;
    next.events.push({ type: 'CONDITION_REPLACED', previous, current: observation.condition });
    for (const action of Object.values(next.actions)) {
      if (action.dependsOnCondition && action.status === 'READY') action.status = 'BLOCKED';
    }
  }

  for (const [id, evidence] of Object.entries(observation.actions ?? {})) {
    const action = next.actions[id];
    if (!action) continue;
    if (TERMINAL.has(action.status)) continue; // completed consequences never regress/repeat
    if (evidence.completed === true) {
      action.status = 'COMPLETED';
      action.evidence = evidence.evidence ?? 'observed-completion';
    } else if (evidence.failed === true) {
      action.status = 'FAILED';
      action.failure = evidence.failure ?? 'observed-failure';
    }
  }

  for (const [id, action] of Object.entries(next.actions)) {
    if (action.status === 'COMPLETED') continue;
    const prereqs = action.requires ?? [];
    const prereqsComplete = prereqs.every((p) => next.actions[p]?.status === 'COMPLETED');
    const conditionOkay = !action.dependsOnCondition || Boolean(next.condition);
    if (prereqsComplete && conditionOkay && action.status !== 'FAILED') action.status = 'READY';
    else if (action.status !== 'FAILED') action.status = 'BLOCKED';
  }

  next.eligible = Object.entries(next.actions)
    .filter(([, action]) => action.status === 'READY')
    .map(([id]) => id);
  next.complete = Object.values(next.actions).every((action) => action.status === 'COMPLETED');
  return next;
}

export function mayExecute(state, actionId) {
  return state.eligible?.includes(actionId) === true;
}
