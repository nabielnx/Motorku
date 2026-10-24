#!/usr/bin/env bash
set -euo pipefail
repo=$(cd "$(dirname "$0")/../.." && pwd)
test_dir=$(mktemp -d)
trap 'rm -f -- "$test_dir/bin/curl" "$test_dir/bin/sleep" "$test_dir/count" "$test_dir/result"; rmdir -- "$test_dir/bin" "$test_dir"' EXIT
mkdir "$test_dir/bin"
cat > "$test_dir/bin/curl" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
count=$(cat "$HEALTH_TEST_DIR/count")
count=$((count + 1))
echo "$count" > "$HEALTH_TEST_DIR/count"
read -r -a sequence <<< "$HEALTH_TEST_SEQUENCE"
index=$((count - 1))
if [ "$index" -ge "${#sequence[@]}" ]; then index=$((${#sequence[@]} - 1)); fi
status=${sequence[$index]}
while [ "$#" -gt 0 ]; do
    case "$1" in
        --output) body=$2; shift 2 ;;
        --dump-header) headers=$2; shift 2 ;;
        *) shift ;;
    esac
done
case "$status" in
    network) echo -n 000; exit 28 ;;
    challenge) status=200; echo 'Bot verification' > "$body" ;;
    *) echo 'Application up' > "$body" ;;
esac
printf 'HTTP/2 %s\nx-hcdn-request-id: qa-request-id\nSet-Cookie: PRIVATE_TEST_COOKIE\n' "$status" > "$headers"
echo -n "$status"
MOCK
printf '#!/usr/bin/env bash\nexit 0\n' > "$test_dir/bin/sleep"
chmod +x "$test_dir/bin/curl" "$test_dir/bin/sleep"
export HEALTH_TEST_DIR="$test_dir"
export PATH="$test_dir/bin:$PATH"

check() {
    local name=$1 sequence=$2 expected_exit=$3 expected_count=$4
    echo 0 > "$test_dir/count"
    local code=0
    HEALTH_TEST_SEQUENCE="$sequence" bash "$repo/scripts/check-deployment-health.sh" https://qa.example.test \
        > "$test_dir/result" 2>&1 || code=$?
    if [ "$code" -ne "$expected_exit" ] || [ "$(cat "$test_dir/count")" -ne "$expected_count" ]; then
        echo "FAIL: $name (exit $code, requests $(cat "$test_dir/count"))" >&2
        cat "$test_dir/result" >&2
        exit 1
    fi
    if grep -q PRIVATE_TEST_COOKIE "$test_dir/result"; then
        echo 'FAIL: response cookie was exposed' >&2
        exit 1
    fi
    echo "PASS: $name"
}

check 'healthy Laravel and storefront' '200 200' 0 2
check 'transient 403 is retried' '403 200 200' 0 3
check 'persistent 403 remains a hard failure' '403' 1 4
grep -q 'qa-request-id' "$test_dir/result"
check 'server error is retried' '500 200 200' 0 3
check 'network timeout is retried' 'network 200 200' 0 3
check 'HTTP 200 challenge is not mistaken for Laravel health' 'challenge 200 200' 0 3
check 'persistent challenge remains a hard failure' 'challenge' 1 4
check 'storefront maintenance is detected despite healthy /up' '200 503 200 503 200 503 200 503' 1 8
check 'storefront recovers from maintenance' '200 503 200 200' 0 4
check 'incorrect health route fails without retries' '404' 1 1

echo 0 > "$test_dir/count"
if bash "$repo/scripts/check-deployment-health.sh" http://qa.example.test > "$test_dir/result" 2>&1; then
    echo 'FAIL: insecure application URL accepted' >&2
    exit 1
fi
test "$(cat "$test_dir/count")" -eq 0
echo 'PASS: insecure URL rejected before connecting'
