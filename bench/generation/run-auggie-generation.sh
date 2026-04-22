#!/usr/bin/env bash
set -uo pipefail

REPO_ROOT="${GITHUB_WORKSPACE:-$(pwd)}"
AGENT_SLUG="${BENCH_AGENT_SLUG:-auggie-claude-sonnet-46}"
AUGGIE_MODEL="${AUGGIE_MODEL:-sonnet4.6}"
AUGGIE_TIMEOUT_MINUTES="${AUGGIE_TIMEOUT_MINUTES:-30}"
BASE_PROMPT="${BASE_PROMPT:-bench/generation/prompts/auggie-chess-agent.md}"
ARTIFACT_DIR="${ARTIFACT_DIR:-bench/generation/artifacts/${AGENT_SLUG}}"

if ! [[ "$AUGGIE_TIMEOUT_MINUTES" =~ ^[0-9]+$ ]]; then
  AUGGIE_TIMEOUT_MINUTES=30
elif [ "$AUGGIE_TIMEOUT_MINUTES" -gt 30 ]; then
  AUGGIE_TIMEOUT_MINUTES=30
fi

mkdir -p "$REPO_ROOT/$ARTIFACT_DIR" "$REPO_ROOT/bench/agents"

run_with_timeout() {
  local minutes="$1"
  shift
  if command -v timeout >/dev/null 2>&1; then
    timeout "${minutes}m" "$@"
    return $?
  fi
  if command -v gtimeout >/dev/null 2>&1; then
    gtimeout "${minutes}m" "$@"
    return $?
  fi
  "$@" &
  local pid=$!
  (
    sleep "$((minutes * 60))"
    kill -TERM "$pid" >/dev/null 2>&1 || true
    sleep 5
    kill -KILL "$pid" >/dev/null 2>&1 || true
  ) &
  local watcher=$!
  wait "$pid"
  local status=$?
  kill "$watcher" >/dev/null 2>&1 || true
  return "$status"
}

PROMPT_FILE="$REPO_ROOT/$ARTIFACT_DIR/prompt.md"
TRANSCRIPT_FILE="$REPO_ROOT/$ARTIFACT_DIR/auggie-transcript.log"
COMMAND_FILE="$REPO_ROOT/$ARTIFACT_DIR/run-auggie-command.sh"
METADATA_FILE="$REPO_ROOT/$ARTIFACT_DIR/metadata.json"

cat "$REPO_ROOT/$BASE_PROMPT" > "$PROMPT_FILE"
cat >> "$PROMPT_FILE" <<EOF

## Workflow run parameters

- BENCH_AGENT_SLUG: $AGENT_SLUG
- AUGGIE_MODEL: $AUGGIE_MODEL
- AUGGIE_TIMEOUT_MINUTES: $AUGGIE_TIMEOUT_MINUTES
- expected agent path: bench/agents/$AGENT_SLUG.js
EOF

cat > "$METADATA_FILE" <<EOF
{
  "agentSlug": "$AGENT_SLUG",
  "auggieModel": "$AUGGIE_MODEL",
  "modelProvider": "Anthropic",
  "modelName": "Claude Sonnet 4.6",
  "harnessName": "auggie-print",
  "timeoutMinutes": $AUGGIE_TIMEOUT_MINUTES,
  "promptFile": "$ARTIFACT_DIR/prompt.md",
  "transcriptFile": "$ARTIFACT_DIR/auggie-transcript.log"
}
EOF

cat > "$COMMAND_FILE" <<'EOF'
#!/usr/bin/env bash
set -uo pipefail
auggie \
  --print \
  --output-format text \
  --model "$AUGGIE_MODEL" \
  --workspace-root "$REPO_ROOT" \
  --allow-indexing \
  --wait-for-indexing \
  --permission codebase-retrieval:allow \
  --permission remove-files:allow \
  --permission save-file:allow \
  --permission apply_patch:allow \
  --permission str-replace-editor:allow \
  --permission view:allow \
  --permission launch-process:allow \
  --permission kill-process:allow \
  --permission read-process:allow \
  --permission write-process:allow \
  --permission list-processes:allow \
  --permission web-search:allow \
  --permission github-api:allow \
  --permission web-fetch:allow \
  --permission conversation-retrieval:allow \
  --permission sub-agent-explore:allow \
  --permission sub-agent-plan:allow \
  --permission sub-agent-main-agent:allow \
  --permission ask-user:allow \
  --permission enter-plan-mode:allow \
  --permission exit-plan-mode:allow \
  --permission view_tasklist:allow \
  --permission reorganize_tasklist:allow \
  --permission update_tasks:allow \
  --permission add_tasks:allow \
  --instruction-file "$PROMPT_FILE"
EOF
chmod +x "$COMMAND_FILE"
export REPO_ROOT AGENT_SLUG AUGGIE_MODEL PROMPT_FILE

echo "Running Auggie non-interactive generation with model: $AUGGIE_MODEL"
echo "Prompt: $PROMPT_FILE"
echo "Transcript: $TRANSCRIPT_FILE"

set +e
run_with_timeout "$AUGGIE_TIMEOUT_MINUTES" bash "$COMMAND_FILE" 2>&1 | tee "$TRANSCRIPT_FILE"
AUGGIE_EXIT_CODE=$?
set -e

echo "$AUGGIE_EXIT_CODE" > "$REPO_ROOT/$ARTIFACT_DIR/auggie-exit-code.txt"
git -C "$REPO_ROOT" status --short > "$REPO_ROOT/$ARTIFACT_DIR/git-status.txt" || true
git -C "$REPO_ROOT" diff -- bench/agents bench/agents.json > "$REPO_ROOT/$ARTIFACT_DIR/generated-agent.diff" || true

if [ -f "$REPO_ROOT/bench/agents/$AGENT_SLUG.js" ]; then
  wc -c "$REPO_ROOT/bench/agents/$AGENT_SLUG.js" > "$REPO_ROOT/$ARTIFACT_DIR/source-size.txt"
fi

echo "Auggie exit code: $AUGGIE_EXIT_CODE"
echo "Generation artifacts written to $ARTIFACT_DIR"