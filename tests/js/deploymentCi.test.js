import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { hasSuccessfulCi } from '../../scripts/check-ci-run.mjs';

const sha = 'a'.repeat(40);
const run = { head_sha: sha, head_branch: 'main', event: 'push', status: 'completed', conclusion: 'success' };
const report = overrides => ({ workflow_runs: [{ ...run, ...overrides }] });

test('successful push and manually requested CI qualify for the exact release commit', () => {
    for (const event of ['push', 'workflow_dispatch']) {
        assert.equal(hasSuccessfulCi(report({ event }), sha, 'main'), true);
    }
});

test('PR checks and checks for other branches or commits cannot authorize deployment', () => {
    for (const overrides of [{ event: 'pull_request' }, { event: 'workflow_run' }, { head_branch: 'develop' }, { head_sha: 'b'.repeat(40) }]) {
        assert.equal(hasSuccessfulCi(report(overrides), sha, 'main'), false);
    }
});

test('unfinished, failed, cancelled and skipped runs keep deployment blocked', () => {
    for (const overrides of [
        { status: 'queued' }, { status: 'in_progress' }, { conclusion: null },
        { conclusion: 'failure' }, { conclusion: 'cancelled' }, { conclusion: 'skipped' },
    ]) assert.equal(hasSuccessfulCi(report(overrides), sha, 'main'), false);
});

test('missing or malformed CI data and missing release identity fail closed', () => {
    for (const data of [null, {}, { workflow_runs: [] }, { workflow_runs: null }, { workflow_runs: [null] }, { message: 'API error' }]) {
        assert.equal(hasSuccessfulCi(data, sha, 'main'), false);
    }
    assert.equal(hasSuccessfulCi(report({}), '', 'main'), false);
    assert.equal(hasSuccessfulCi(report({}), sha, ''), false);
});

test('the CLI accepts manual CI and returns actionable failures without bypassing the gate', () => {
    const directory = mkdtempSync(join(tmpdir(), 'tokom-ci-'));
    const file = join(directory, 'runs.json');
    const script = fileURLToPath(new URL('../../scripts/check-ci-run.mjs', import.meta.url));
    try {
        writeFileSync(file, JSON.stringify(report({ event: 'workflow_dispatch' })));
        assert.equal(spawnSync(process.execPath, [script, file, sha, 'main']).status, 0);
        writeFileSync(file, JSON.stringify({ workflow_runs: [] }));
        const missing = spawnSync(process.execPath, [script, file, sha, 'main'], { encoding: 'utf8' });
        assert.equal(missing.status, 1);
        assert.match(missing.stderr, /Run the CI workflow/);
        writeFileSync(file, 'invalid JSON');
        assert.equal(spawnSync(process.execPath, [script, file, sha, 'main']).status, 1);
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});
