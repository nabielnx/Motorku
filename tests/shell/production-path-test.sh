#!/usr/bin/env bash
set -euo pipefail
repo=$(cd "$(dirname "$0")/../.." && pwd)
fixture=$(mktemp -d)
trap 'rm -rf -- "$fixture"' EXIT
python3 - "$repo" "$fixture/check.sh" <<'PY'
import sys, textwrap
with open(sys.argv[1] + '/.github/workflows/deploy-production.yml', encoding='utf-8') as source:
    lines = source.read().splitlines()
start = next(index for index, line in enumerate(lines) if line.strip() == '- name: Check server is provisioned')
start = next(index + 1 for index in range(start, len(lines)) if lines[index].strip() == 'script: |')
end = next(index for index in range(start, len(lines)) if lines[index].startswith('      - '))
script = textwrap.dedent('\n'.join(lines[start:end]))
with open(sys.argv[2], 'w', encoding='utf-8') as target:
    target.write(script)
PY
mkdir -p "$fixture/production/storage" "$fixture/staging"
touch "$fixture/production/.env" "$fixture/production/artisan"
check() {
    local name=$1 staging=$2 expected=$3 code=0
    DEPLOY_PATH="$fixture/production" STAGING_PATH="$staging" FIRST_INSTALL=false bash "$fixture/check.sh" > "$fixture/result" 2>&1 || code=$?
    if [ "$code" -ne "$expected" ]; then cat "$fixture/result"; echo "FAIL: $name"; exit 1; fi
    echo "PASS: $name"
}
check 'production works without staging configuration' '' 0
check 'production works after staging directory removal' "$fixture/removed-staging" 0
check 'separate staging remains supported' "$fixture/staging" 0
check 'identical production and staging are rejected' "$fixture/production" 1
check 'production inside staging is rejected' "$fixture" 1
check 'staging inside production is rejected' "$fixture/production/old-staging" 1
ln -s "$fixture/production" "$fixture/staging-alias"
check 'staging symlink to production is rejected' "$fixture/staging-alias" 1
check 'normalized overlapping path is rejected' "$fixture/staging/../production" 1
