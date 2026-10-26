import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function hasSuccessfulCi(report, sha, branch) {
    if (!/^[a-f0-9]{40}$/.test(sha ?? '') || !branch || !Array.isArray(report?.workflow_runs)) return false;

    return report.workflow_runs.some(run => run?.head_sha === sha
        && run.head_branch === branch
        && ['push', 'workflow_dispatch'].includes(run.event)
        && run.status === 'completed'
        && run.conclusion === 'success');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    try {
        const [, , file, sha, branch] = process.argv;
        const report = JSON.parse(readFileSync(file, 'utf8'));
        if (!hasSuccessfulCi(report, sha, branch)) {
            console.error(`No successful CI run for ${branch} at ${sha}. Run the CI workflow on that branch, wait for success, then retry deployment. PR checks and checks for other commits do not qualify.`);
            process.exitCode = 1;
        } else {
            console.log(`Successful CI confirmed for ${branch} at ${sha}.`);
        }
    } catch {
        console.error('Cannot read a valid CI response. Deployment remains blocked.');
        process.exitCode = 1;
    }
}
