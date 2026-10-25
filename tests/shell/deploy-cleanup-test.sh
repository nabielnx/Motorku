#!/usr/bin/env bash
set -euo pipefail
repo=$(cd "$(dirname "$0")/../.." && pwd)
work=$(mktemp -d)
test "$(realpath "$work")" != / && test -d "$work"
trap 'rm -rf --one-file-system -- "$work"' EXIT
root="$work/app"
outside="$work/other-site"
sha=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
mkdir -p "$root/storage" "$root/.deploy-backups" "$outside"
touch "$root/.env" "$root/artisan" "$root/storage/upload.jpg" "$root/.deploy-backups/backup.sql" "$outside/keep"
target="$root/.incoming-$sha"
script="$repo/scripts/cleanup-incoming-release.sh"
make_release() { mkdir -p "$target/vendor/package"; touch "$target/vendor/package/code.php"; }
reject() {
    if bash "$script" "$@" > "$work/result" 2>&1; then echo 'FAIL: unsafe cleanup accepted' >&2; exit 1; fi
    test -f "$outside/keep" && test -f "$root/storage/upload.jpg" && test -f "$root/.env" && test -f "$root/.deploy-backups/backup.sql"
}
make_release
bash "$script" "$root" "$sha"
test -d "$target"
echo 'PASS: dry run preserves release'
ln -s "$outside" "$target/external-link"
bash "$script" "$root" "$sha" --apply
test ! -e "$target" && test -f "$outside/keep" && test -f "$root/storage/upload.jpg" && test -f "$root/.deploy-backups/backup.sql"
bash "$script" "$root" "$sha" --apply
echo 'PASS: removes only selected release, preserves linked data, and supports retries'
reject "$root" '../storage' --apply
reject "$root" '' --apply
reject / "$sha" --apply
reject "$root" "$sha" --unknown
echo 'PASS: invalid paths, SHA, root, and mode rejected'
ln -s "$outside" "$target"
reject "$root" "$sha" --apply
unlink "$target"
echo 'PASS: release symlink rejected'
make_release
ln -s "$target/vendor" "$root/vendor"
reject "$root" "$sha" --apply
test -f "$target/vendor/package/code.php"
unlink "$root/vendor"
echo 'PASS: active application symlink rejected'
touch "$target/.env"
reject "$root" "$sha" --apply
rm -- "$target/.env"
mkdir "$target/storage"
reject "$root" "$sha" --apply
rmdir "$target/storage"
echo 'PASS: persistent data in incoming release rejected'
(
    exec 8>"$root/.deploy.lock"
    flock -n 8
    reject "$root" "$sha" --apply
)
test -d "$target"
echo 'PASS: active deployment lock prevents deletion'
bash "$script" "$root" "$sha" --apply
test ! -e "$target"
