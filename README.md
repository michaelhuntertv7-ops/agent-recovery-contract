# Agent Recovery Contract

A tiny, dependency-free reference implementation for one safety rule in tool-using agents:

> **Reconcile what actually happened before resuming an interrupted workflow.**

This public project was created during the Build, Ship, Shape: Amazon Developer Hackathon window as an additional open-source contribution alongside **Continuity for Alexa+**. It is intentionally generic and contains **no private Continuity source code, credentials, provider integrations, or proprietary build artifacts**.

## Why it exists

A blind `continue` or retry can duplicate a completed consequence, promote a failed attempt into a false success, or ignore a real-world condition that changed during interruption. This reference contract demonstrates three fail-closed behaviors:

1. **Completed consequences do not regress or repeat.**
2. **Failed actions remain failed until explicit completion evidence exists.**
3. **Downstream actions become eligible only after prerequisites and current conditions are reconciled.**

## Run

Requires Node.js 20+ and no third-party packages.

```bash
npm test
```

The test suite covers preserved completion, failed-attempt handling, explicit completion evidence, prerequisite gating, condition replacement, unknown evidence, incomplete workflows, and evidence-backed final completion.

## Minimal API

```js
import { reconcile, mayExecute } from './src/recovery.js';

const reconciled = reconcile(snapshot, observation);
if (mayExecute(reconciled, 'A3')) {
  // the caller may now consider A3 for execution
}
```

`reconcile()` does not call providers or execute side effects. It only computes deterministic state from a prior snapshot and fresh observations. Execution authority remains outside this library.

## Relationship to Continuity

Continuity for Alexa+ is the private, judge-facing competition application. This repository is a separate open-source reference artifact that exposes only a small reusable recovery contract. The private application remains the authoritative competition implementation.

## Scope and limitations

- Reference implementation, not a production workflow engine.
- No networking, credentials, payments, bookings, or other real-world side effects.
- No automatic retries.
- No inference or model calls.
- No claim that an observation is trustworthy; callers remain responsible for evidence provenance.

## License

Apache-2.0. See `LICENSE`.
