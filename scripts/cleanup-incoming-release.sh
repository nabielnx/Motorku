#!/usr/bin/env bash
set -euo pipefail

root=$(realpath -e "${1:?Usage: cleanup-incoming-release.sh APP_ROOT COMMIT_SHA [--apply]}")
sha=${2:?A full commit SHA is required}
mode=${3:---dry-run}
case "$root" in /|/var|/var/www|/home|/srv) echo 'Unsafe deployment root' >&2; exit 1;; esac
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid release SHA' >&2; exit 1; }
case "$mode" in --apply|--dry-run) ;; *) echo 'Invalid cleanup mode' >&2; exit 1;; esac
test -f "$root/.env" && test -d "$root/storage" && test -f "$root/artisan"

# Activation and cleanup must never mutate the same release concurrently.
exec 9>"$root/.deploy.lock"
flock -n 9 || { echo 'Deployment is active; cleanup refused' >&2; exit 1; }
target="$root/.incoming-$sha"
if [ ! -e "$target" ] && [ ! -L "$target" ]; then
    echo "Release already absent: .incoming-$sha"
    exit 0
fi
test ! -L "$target" && test -d "$target"
test "$(realpath -e "$target")" = "$target"

# Incoming packages contain code only. Refuse anything resembling persistent data.
for path in .env storage; do
    if [ -e "$target/$path" ] || [ -L "$target/$path" ]; then
        echo "Refusing release containing persistent $path" >&2
        exit 1
    fi
done
for path in .env app bootstrap config database public resources routes vendor scripts storage; do
    if [ -e "$root/$path" ] || [ -L "$root/$path" ]; then
        active=$(realpath -e "$root/$path")
        case "$active" in "$target"|"$target"/*) echo "Active $path points into release; cleanup refused" >&2; exit 1;; esac
    fi
done

if [ "$mode" = --dry-run ]; then
    echo "Would remove: $target"
    exit 0
fi
rm -rf --one-file-system -- "$target"
test ! -e "$target" && test ! -L "$target"
echo "Removed temporary release: .incoming-$sha"
