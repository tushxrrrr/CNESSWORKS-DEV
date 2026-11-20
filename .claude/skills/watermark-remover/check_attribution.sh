#!/usr/bin/env bash
# PreToolUse hook for Bash: blocks a git commit (or a PR body written through the shell) that carries AI attribution.
cmd=$(jq -r '.tool_input.command // empty')
case "$cmd" in *"git commit"*|*"gh pr"*) ;; *) exit 0 ;; esac
if printf '%s' "$cmd" | grep -qiE 'co-authored-by: *claude|claude-session:|generated with \[claude code\]|claude\.ai/code/session'; then
  echo "Blocked by watermark-remover: remove the Co-Authored-By / Claude-Session / 'Generated with Claude Code' lines from the commit message, then commit again." >&2
  exit 2
fi
exit 0
