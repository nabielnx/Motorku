# Temporary deployment cleanup

Each deployment extracts code and dependencies into `.incoming-<commit SHA>` before copying them into the active application. These extracted files must not accumulate across releases.

Staging and production workflows clean their own incoming directory after the health check and any maintenance recovery step have finished, including failed activation attempts with a complete extraction. Database and compressed code backups remain in `.deploy-backups`. Cleanup errors produce a workflow warning without taking a healthy application offline or hiding an earlier deployment failure. Incomplete extractions are retained for manual review.

Activation and cleanup share `.deploy.lock`. Cleanup refuses symlink releases, an active application pointing into the candidate, and releases containing a root `.env` or `storage`. Only a direct `.incoming-` directory with a full lowercase 40-character commit SHA can be removed.

Review a specific leftover release on the server:

```bash
bash scripts/cleanup-incoming-release.sh /absolute/path/to/motorku FULL_COMMIT_SHA
```

After checking that the deployment has finished, add `--apply` to delete that exact temporary directory. The default is a dry run. Do not point this command at another site's release directories.

Regression checks:

```bash
bash tests/shell/deploy-health-check-test.sh
bash tests/shell/deploy-cleanup-test.sh
```
